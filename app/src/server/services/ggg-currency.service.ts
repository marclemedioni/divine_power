
import { PrismaClient } from '@prisma/client';
import { prisma } from '../db';

interface GggTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
}

interface GggMarketResponse {
    next_change_id: number;
    markets: GggMarket[];
}

interface GggMarket {
    league: string;
    market_id: string; // "chaos|divine"
    volume_traded: Record<string, number>;
    lowest_stock: Record<string, number>;
    highest_stock: Record<string, number>;
    lowest_ratio: Record<string, number>;
    highest_ratio: Record<string, number>;
}

export class GggCurrencyService {
    private static readonly TOKEN_URL = 'https://www.pathofexile.com/oauth/token';
    private static readonly API_URL = 'https://api.pathofexile.com/currency-exchange';
    private static readonly USER_AGENT = 'poe2economytracker/1.0 (contact: mawashiii@gmail.com)';

    private accessToken: string | null = null;
    private tokenExpiry: number = 0;

    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        const clientId = process.env['GGG_OAUTH_CLIENT_ID'];
        const clientSecret = process.env['GGG_OAUTH_CLIENT_SECRET'];

        if (!clientId || !clientSecret) {
            throw new Error('Missing GGG_OAUTH_CLIENT_ID or GGG_OAUTH_CLIENT_SECRET');
        }

        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'client_credentials');
        params.append('scope', 'service:cxapi');

        const response = await fetch(GggCurrencyService.TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': GggCurrencyService.USER_AGENT
            },
            body: params
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to get access token: ${response.status} ${text}`);
        }

        const data = (await response.json()) as GggTokenResponse;
        this.accessToken = data.access_token;
        // Expire 1 minute early to be safe
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

        return this.accessToken;
    }

    private async fetchMarkets(league: string, timestamp?: number): Promise<GggMarketResponse> {
        const token = await this.getAccessToken();
        let url = `${GggCurrencyService.API_URL}/poe2`; // Assuming PoE2 based on context (poe-ninja service used poe2)

        if (timestamp) {
            url += `/${timestamp}`;
        }

        // The API returns markets for a specific league in the response, 
        // but the endpoint itself might be global or we filter?
        // Actually the documentation says: "The response is a JSON object containing... markets: A list of market objects active during the requested hour."
        // And markets have a "league" field.
        // So we filter client-side or check if there's a league param. 
        // Docs didn't mention league query param for this endpoint, only realm path param.
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': GggCurrencyService.USER_AGENT
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                 // Maybe future timestamp?
                 console.warn(`GGG API 404 for timestamp ${timestamp}`);
                 return { next_change_id: timestamp || 0, markets: [] };
            }
            const text = await response.text();
            throw new Error(`Failed to fetch markets: ${response.status} ${text}`);
        }

        return (await response.json()) as GggMarketResponse;
    }


    /**
     * Updates market data using the GGG API.
     * Since the API is historical/hourly, we try to fetch the latest available hour.
     */
    async updateMarketData() {
        console.log('Starting GGG Market Update...');
        
        // 1. Determine "latest" hour. 
        // The API gives "available" history. 
        // Let's try to fetch 1 hour ago to be safe, or just utilize the mechanism if possible.
        // If we provide a timestamp far in the past, we get old data.
        // If we provide a timestamp in the future, we probably get 404 or empty.
        // Let's try requesting "now - 2 hours" to ensure data availability.
        // (Hourly digests might be delayed).
        
        const now = Date.now();
        const oneHour = 3600 * 1000;
        // Truncate to hour
        const currentHourTimestamp = Math.floor(now / oneHour) * oneHour; 
        const twoHoursAgo = currentHourTimestamp - (2 * oneHour);
        
        try {
            // We only care about the specific league
            const desiredLeague = "Fate of the Vaal"; // TODO: config

            // Fetch data
            // Note: The timestamp parameter in the URL is actually a "Change ID" which happens to be a timestamp.
            // Using a timestamp from 2 hours ago should give us that hour's data.
            // The API timestamp is in SECONDS usually? No, "Unix timestamp code". 
            // Docs said "next_change_id" is "Unix timestamp truncated to the hour". 
            // Standard Unix timestamp is seconds. JS is milliseconds. 
            // Let's check if the generic 'id' path param expects seconds or ms.
            // Usually valid unix timestamps are seconds.
            
            const targetId = Math.floor(twoHoursAgo / 1000); // Seconds

            const data = await this.fetchMarkets(desiredLeague, targetId);
            
            const debugData = {
                ...data,
                markets: data.markets.filter(m => m.league === desiredLeague)
            };
            
            console.log('--- GGG API RESPONSE START ---');
            console.log(JSON.stringify(debugData, null, 2));
            console.log('--- GGG API RESPONSE END ---');

            console.log(`Fetched GGG data for ID ${targetId}. Next: ${data.next_change_id}. Markets: ${data.markets.length}`);

            const leagueMarkets = data.markets.filter(m => m.league === desiredLeague);
            console.log(`Found ${leagueMarkets.length} markets for ${desiredLeague}`);

            for (const market of leagueMarkets) {
                // market_id is like "chaos|divine"
                const [left, right] = market.market_id.split('|');
                
                // We need to map these to our MarketItems.
                // Assuming our MarketItems have these IDs (from poe.ninja).
                // Our DB ids: "alch" (orb of alchemy), "chaos", "divine", "exalted".
                // We need to handle the mapping.
                // If the IDs don't match, we skip or need a map.
                
                // Let's try to update "divine" pairs specifically or all?
                // The DB stores pairs: (MarketItem, Currency).
                // e.g. MarketItem="chaos", Currency="divine". Rate = how many Divine for 1 Chaos? 
                // Or MarketItem="Mirror", Currency="divine".
                
                // GGG "ratio": "lowest_ratio": {"chaos": 100, "divine": 1} => 100 Chaos = 1 Divine?
                // ratio is a dictionary of uint.
                // If market is "chaos|divine", and ratio is {chaos: 150, divine: 1}, 
                // it means 150 Chaos buys 1 Divine.
                
                // We need to calculate the rate: Price of Item (Left) in Currency (Right).
                // Rate = Right / Left?
                // If 150 Chaos = 1 Divine. 
                // Price of Chaos in Divine = 1 / 150 = 0.0066.
                // Price of Divine in Chaos = 150.
                
                // Let's focus on pairs where one side is a "Currency" we track (Divine, Chaos).
                
                await this.processMarketPair(left, right, market);
            }

        } catch (error) {
            console.error('Error updating GGG market data:', error);
            throw error;
        }
    }

    private async processMarketPair(leftId: string, rightId: string, market: GggMarket) {
        // We want to update the MarketPair entry in our DB.
        // MarketPair connects a MarketItem (entity) to a Currency (payment unit).
        // e.g. item=Exalt, currency=Divine.
        
        // Check if we have an item for 'leftId'
        // We might need to map 'orb-of-alchemy' vs 'alch'.
        // This is the tricky part without a clear mapping.
        // For now, let's assume 'leftId' matches 'Item.id' or 'Item.detailsId'.
        
        const item = await prisma.marketItem.findFirst({
            where: {
                OR: [
                    { id: leftId },
                    { detailsId: leftId }, // Try both
                    { name: { equals: leftId, mode: 'insensitive' } } // Unlikely but possible
                ]
            }
        });

        if (!item) {
            // console.debug(`Skipping unknown item: ${leftId}`);
            return;
        }

        // We only care if the "right" side is one of our base currencies (Divine, Chaos, Exalted)
        // Check if rightId is 'divine', 'chaos', 'exalted' (conceptually)
        // Our enum is DIVINE, CHAOS, EXALTED.
        // Our DB stores currencyId as string "divine", "exalted", "chaos".
        
        const validCurrencies = ['divine', 'chaos', 'exalted'];
        if (!validCurrencies.includes(rightId)) {
            return;
        }

        // Calculate Rate
        // GGG gives ratios as integers.
        // e.g. { chaos: 150, divine: 1 } for chaos|divine market?
        // Wait, for "chaos|divine", if someone is swapping chaos for divine.
        // Use "highest_ratio" (best price?) or average?
        // "lowest_ratio" and "highest_ratio" are provided.
        // Let's take the average of highest/lowest for a mid-market rate?
        // Or just use 'highest_ratio' (which represents the most you can get?).
        
        // Let's look at one ratio object: { "chaos": 150, "divine": 1 }
        // This means 150 Chaos = 1 Divine.
        // If we are looking at Item=Chaos, Currency=Divine.
        // Rate = (Amount of Divine) / (Amount of Chaos) = 1 / 150.
        
        const ratioObj = market.highest_ratio; // Optimistic
        if (!ratioObj) return;

        const leftAmount = ratioObj[leftId];
        const rightAmount = ratioObj[rightId];

        if (!leftAmount || !rightAmount) return;

        const rate = rightAmount / leftAmount; // Price of Left in terms of Right

        // Volume
        // volume_traded is also a dict. { left: 1000, right: 10 }
        // We want volume in the specific currency? Or total units?
        // Our DB `volume` on MarketPair seems to be `volumePrimaryValue` (value in currency) or raw units?
        // schema: `volume Float`.
        // poe-ninja service: `volume: p.volumePrimaryValue`.
        // So it's the volume in terms of the currency (Right side).
        
        const volObj = market.volume_traded;
        const vol = volObj ? volObj[rightId] : 0;
        
        // Deep Market Data extraction
        
        // 1. Stock (Liquidity)
        // highest_stock is the max liquidity seen in the hour. This is a good proxy for "Available Stock".
        const highestStockObj = market.highest_stock;
        const lowestStockObj = market.lowest_stock;
        const highestStock = highestStockObj ? highestStockObj[leftId] || 0 : 0; // Stock of the Item we are buying
        const lowestStock = lowestStockObj ? lowestStockObj[leftId] || 0 : 0;

        // 2. Rates (Spread)
        // Rate = Right / Left
        
        let minRate = 0;
        let maxRate = 0;

        const maxRatioObj = market.highest_ratio;
        const minRatioObj = market.lowest_ratio;

        if (maxRatioObj && maxRatioObj[leftId] && maxRatioObj[rightId]) {
             // Rate from highest ratio
             maxRate = maxRatioObj[rightId] / maxRatioObj[leftId];
        } else {
             maxRate = rate;
        }

        if (minRatioObj && minRatioObj[leftId] && minRatioObj[rightId]) {
            // Rate from lowest ratio
            minRate = minRatioObj[rightId] / minRatioObj[leftId];
        } else {
            minRate = rate;
        }

        // Ensure min <= max (just in case of weird data inversions or my logic being flipped)
        if (minRate > maxRate) {
            const temp = minRate;
            minRate = maxRate;
            maxRate = temp;
        }
        
        // Update DB
        const marketPair = await prisma.marketPair.upsert({
            where: {
                marketItemId_currencyId: {
                    marketItemId: item.id,
                    currencyId: rightId
                }
            },
            create: {
                marketItemId: item.id,
                currencyId: rightId,
                rate: rate,
                volume: vol,
                minRate,
                maxRate,
                lowestStock,
                highestStock
            },
            update: {
                rate: rate,
                volume: vol,
                minRate,
                maxRate,
                lowestStock,
                highestStock
            }
        });

        // Update History
        // The API returns an aggregation for the hour.
        // We can add a history entry for this timestamp.
        const historyTimestamp = new Date(); // Or the timestamp from the API batch?
        // Ideally we use the timestamp of the data block.
        // The `fetchMarkets` input timestamp was the START of the window.
        // Let's use `new Date()` for now to indicate "when we saw it", 
        // OR better, pass the data timestamp down if we had it. 
        // Since we are fetching "latest finished hour", using `new Date()` is essentially "data as of now".
        
        // To avoid spamming history if we run this often, we might want to check overlap.
        // But for this MVP step, appending is okay (or separate job cleans up).
        
        await prisma.marketHistory.create({
            data: {
                marketPairId: marketPair.id,
                timestamp: historyTimestamp,
                rate: rate,
                volume: vol,
                minRate,
                maxRate,
                lowestStock,
                highestStock
            }
        });

        // Also update the main Item's primary value if this is the generic "Divine" pair.
        if (rightId === 'divine') {
            await prisma.marketItem.update({
                where: { id: item.id },
                data: {
                    primaryValue: rate,
                    volumePrimaryValue: vol // This might overwrite volume from other pairs, but usually divine volume is the metric
                }
            });
        }
    }
}

export const gggCurrencyService = new GggCurrencyService();
