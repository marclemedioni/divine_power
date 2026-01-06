import { prisma } from '../db';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

export interface PoeNinjaItemOverview {
  id: string; // e.g. "alch"
  name: string; // e.g. "Orb of Alchemy"
  detailsId: string; // e.g. "orb-of-alchemy"
  image?: string;
  primaryValue: number; // Value in divine? Check API. usually relative to primary currency
  volumePrimaryValue: number; // Total volume?
  change24h?: number;
  category: string;
  pairs: Array<{
    currencyId: string;
    rate: number;
    volume: number;
  }>;
}

export interface PoeNinjaPairData {
  currencyId: string; // "divine", "exalted", "chaos"
  rate: number;
  volume: number; // volumePrimaryValue
  history?: Array<{
    timestamp: string;
    rate: number;
    volumePrimaryValue: number;
  }>;
}

export interface PoeNinjaItemDetails {
  id: string;
  name: string;
  detailsId: string;
  primaryValue: number;
  category: string;
  pairs: PoeNinjaPairData[];
}

interface ApiOverviewResponse {
  items: Array<{
    id: string;
    name: string;
    detailsId: string;
    image?: string;
  }>;
  lines: Array<{
    id: string;
    primaryValue: number;
    volumePrimaryValue: number;
  }>;
}

interface ApiDetailsResponse {
  item: {
    id: string;
    name: string;
  };
  pairs: Array<{
    id: string; // "divine", "exalted", etc.
    rate: number;
    volumePrimaryValue: number;
    history?: Array<{
      timestamp: string;
      rate: number;
      volumePrimaryValue: number;
    }>;
  }>;
}

export class PoeNinjaService {
  private static readonly BASE_URL = 'https://poe.ninja/poe2/api/economy/exchange/current';
  public static readonly LEAGUE = 'Fate of the Vaal'; // TODO: Move to DB or ConfigService
  private static readonly ASSETS_DIR = path.join(process.cwd(), 'app', 'public', 'assets', 'poe-ninja');
  private static readonly CATEGORIES = ['Currency', 'Ritual', 'Abyss'];

  async updateAll() {
    // Ensure assets dir exists
    if (!fs.existsSync(PoeNinjaService.ASSETS_DIR)) {
      fs.mkdirSync(PoeNinjaService.ASSETS_DIR, { recursive: true });
    }

    for (const category of PoeNinjaService.CATEGORIES) {
        console.log(`Fetching ${category} overview from Poe.ninja...`);
        try {
            const overview = await this.fetchCurrencyOverview(category);
            console.log(`Found ${overview.length} items in ${category}. Starting update...`);
            
            for (const item of overview) {
                // 1. Download image
                let localImagePath: string | null = null;
                if (item.image) {
                    try {
                        const url = new URL(item.image);
                        const extension = path.extname(url.pathname) || '.png';
                        // Add category to filename to avoid collisions if needed, though detailsId should be unique
                        const fileName = `${item.detailsId}${extension}`;
                        const localFile = path.join(PoeNinjaService.ASSETS_DIR, fileName);
                        const publicPath = `/assets/poe-ninja/${fileName}`;
                        
                        if (!fs.existsSync(localFile)) {
                            const response = await fetch(item.image);
                            if (response.ok && response.body) {
                                const fileStream = fs.createWriteStream(localFile);
                                // @ts-expect-error - Readable.fromWeb and stream/promises types conflict in current env
                                await finished(Readable.fromWeb(response.body).pipe(fileStream));
                            }
                        }
                        localImagePath = publicPath;
                    } catch (e) {
                        console.error(`Failed to download image for ${item.name}`, e);
                    }
                }

                // 2. Upsert Item
                const marketItem = await prisma.marketItem.upsert({
                    where: { detailsId: item.detailsId },
                    create: {
                        id: item.id,
                        name: item.name,
                        detailsId: item.detailsId,
                        image: localImagePath,
                        category: category,
                        primaryValue: item.primaryValue,
                        volumePrimaryValue: item.volumePrimaryValue,
                    },
                    update: {
                        primaryValue: item.primaryValue,
                        volumePrimaryValue: item.volumePrimaryValue,
                        image: localImagePath ?? undefined,
                        category: category,
                    }
                });

                // 3. Fetch Details and update pairs
                try {
                    const details = await this.fetchItemDetails(item.detailsId, item.primaryValue, category);
                    
                    for (const pair of details.pairs) {
                        const marketPair = await prisma.marketPair.upsert({
                            where: {
                                marketItemId_currencyId: {
                                    marketItemId: marketItem.id,
                                    currencyId: pair.currencyId
                                }
                            },
                            create: {
                                marketItemId: marketItem.id,
                                currencyId: pair.currencyId,
                                rate: pair.rate,
                                volume: pair.volume
                            },
                            update: {
                                rate: pair.rate,
                                volume: pair.volume
                            }
                        });

                        // 4. Update History
                        if (pair.history && pair.history.length > 0) {
                            // Clear old history to avoid duplicates
                            await prisma.marketHistory.deleteMany({
                                where: { marketPairId: marketPair.id }
                            });
                            
                            await prisma.marketHistory.createMany({
                                data: pair.history.map(h => ({
                                    marketPairId: marketPair.id,
                                    timestamp: new Date(h.timestamp), 
                                    rate: h.rate,
                                    volume: h.volumePrimaryValue
                                }))
                            });
                        }
                    }
                } catch (e) {
                    console.error(`Failed to update details for ${item.name}`, e);
                }
                
                // Add a small delay to rate limit
                await new Promise(r => setTimeout(r, 200));
            }
        } catch (e) {
            console.error(`Failed to fetch overview for ${category}`, e);
        }
    }
  }

  async getCurrencyOverview(): Promise<PoeNinjaItemOverview[]> {
    const items = await prisma.marketItem.findMany({
        orderBy: { volumePrimaryValue: 'desc' },
        include: {
            pairs: {
                include: {
                    history: {
                        orderBy: { timestamp: 'desc' },
                        take: 48 // Limit history fetch
                    }
                }
            }
        }
    });

    return items.map(item => {
        // Calculate 24h change for Divine pair
        let change24h = 0;
        const divinePair = item.pairs.find(p => p.currencyId === 'divine');
        
        if (divinePair && divinePair.history.length > 0) {
            const current = divinePair.rate;
            // Find roughly 24h ago
            // Since we sort desc, history[0] is newest.
            // We want something ~1 day older.
            const now = new Date().getTime();
            const oneDayMs = 24 * 60 * 60 * 1000;
            
            const pastEntry = divinePair.history.find(h => {
                const age = now - h.timestamp.getTime();
                return age >= oneDayMs;
            });

            // If found, or fallback to oldest fetched
            const ref = pastEntry || divinePair.history[divinePair.history.length - 1];
            
            if (ref && ref.rate !== 0) {
                change24h = ((current - ref.rate) / ref.rate) * 100;
            }
        }

        return {
            id: item.id,
            name: item.name,
            detailsId: item.detailsId,
            image: item.image ?? undefined,
            primaryValue: item.primaryValue,
            volumePrimaryValue: item.volumePrimaryValue,
            change24h,
            category: item.category,
            pairs: item.pairs.map(p => ({
                currencyId: p.currencyId,
                rate: p.rate,
                volume: p.volume
            }))
        };
    });
  }

  async getItemDetails(detailsId: string): Promise<PoeNinjaItemDetails | null> {
     const item = await prisma.marketItem.findUnique({
         where: { detailsId },
         include: {
             pairs: {
                 include: {
                     history: {
                         orderBy: { timestamp: 'asc' }
                     }
                 }
             }
         }
     });
     
     if (!item) return null;

     return {
         id: item.id,
         name: item.name,
         detailsId: item.detailsId,
         primaryValue: item.primaryValue,
         category: item.category,
         pairs: item.pairs.map(p => ({
             currencyId: p.currencyId,
             rate: p.rate,
             volume: p.volume,
             history: p.history.map(h => ({
                 timestamp: h.timestamp.toISOString(),
                 rate: h.rate,
                 volumePrimaryValue: h.volume
             }))
         }))
     };
  }

  // Helper method to fetch API directly (internal use only)
  private async fetchCurrencyOverview(type: string): Promise<PoeNinjaItemOverview[]> {
    const url = `${PoeNinjaService.BASE_URL}/overview?league=${encodeURIComponent(PoeNinjaService.LEAGUE)}&type=${type}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch overview: ${response.statusText}`);
    }
    
    const data = await response.json() as ApiOverviewResponse;
    if (!data.lines || data.lines.length === 0) {
        console.warn(`No market lines found for ${type} in league ${PoeNinjaService.LEAGUE}. API might be down or league name invalid.`);
        return [];
    }
    console.log(`Fetched ${data.lines.length} lines for ${type}`);
    const itemMap = new Map(data.items.map(i => [i.id, i]));
    const results: PoeNinjaItemOverview[] = [];
    
    for (const line of data.lines) {
      const info = itemMap.get(line.id);
      if (info) {
        results.push({
          id: line.id,
          name: info.name,
          detailsId: info.detailsId,
          image: info.image ? 'https://web.poecdn.com' + info.image : undefined,
          primaryValue: line.primaryValue,
          volumePrimaryValue: line.volumePrimaryValue,
          category: type,
          pairs: []
        });
      }
    }
    return results;
  }

  // Helper method to fetch details API directly (internal use only)
  private async fetchItemDetails(detailsId: string, primaryValue: number, type: string): Promise<PoeNinjaItemDetails> {
    const url = `${PoeNinjaService.BASE_URL}/details?league=${encodeURIComponent(PoeNinjaService.LEAGUE)}&type=${type}&id=${encodeURIComponent(detailsId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch details for ${detailsId}: ${response.statusText}`);
    }

    const data = await response.json() as ApiDetailsResponse;

    return {
      id: data.item.id,
      name: data.item.name,
      detailsId: detailsId,
      category: type,
      primaryValue: primaryValue,
      pairs: data.pairs.map(p => ({
        currencyId: p.id,
        rate: p.rate ?? 0,
        volume: p.volumePrimaryValue ?? 0,
        history: p.history // data.pairs in api has history
      }))
    };
  }
}


export const poeNinjaService = new PoeNinjaService();
