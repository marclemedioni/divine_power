
export interface PoeNinjaItemOverview {
  id: string; // e.g. "alch"
  name: string; // e.g. "Orb of Alchemy"
  detailsId: string; // e.g. "orb-of-alchemy"
  image?: string;
  primaryValue: number; // Value in divine? Check API. usually relative to primary currency
  volumePrimaryValue: number; // Total volume?
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
  private static readonly LEAGUE = 'Fate of the Vaal'; // TODO: Make configurable?

  async getCurrencyOverview(): Promise<PoeNinjaItemOverview[]> {
    const url = `${PoeNinjaService.BASE_URL}/overview?league=${encodeURIComponent(PoeNinjaService.LEAGUE)}&type=Currency`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch overview: ${response.statusText}`);
    }
    
    const data = await response.json() as ApiOverviewResponse;
    
    // Map lines to items to combine metadata with values
    // usage of data.items instead of data.core.items
    const itemMap = new Map(data.items.map(i => [i.id, i]));
    
    const results: PoeNinjaItemOverview[] = [];
    
    for (const line of data.lines) {
      const info = itemMap.get(line.id);
      if (info) {
        results.push({
          id: line.id,
          name: info.name,
          detailsId: info.detailsId,
          image: 'https://web.poecdn.com' + info.image,
          primaryValue: line.primaryValue,
          volumePrimaryValue: line.volumePrimaryValue,
        });
      }
    }
    
    return results;
  }

  async getItemDetails(detailsId: string): Promise<PoeNinjaItemDetails> {
    const url = `${PoeNinjaService.BASE_URL}/details?league=${encodeURIComponent(PoeNinjaService.LEAGUE)}&type=Currency&id=${encodeURIComponent(detailsId)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch details for ${detailsId}: ${response.statusText}`);
    }

    const data = await response.json() as ApiDetailsResponse;

    return {
      id: data.item.id,
      name: data.item.name,
      pairs: data.pairs.map(p => ({
        currencyId: p.id,
        rate: p.rate,
        volume: p.volumePrimaryValue,
        history: (p as any).history // data.pairs in api has history
      }))
    };
  }
}


export const poeNinjaService = new PoeNinjaService();
