/**
 * poe.ninja API Service for POE2
 * Fetches market data for Path of Exile 2 items
 */

import { prisma, type Currency, Prisma } from '../db';

// POE2 poe.ninja API endpoints
const POE_NINJA_BASE_URL = 'https://poe.ninja/poe2/api/economy/exchange/current';
const POE_CDN_BASE_URL = 'https://web.poecdn.com';
const POE_NINJA_LEAGUE = (typeof process !== 'undefined' ? process.env['POE_NINJA_LEAGUE'] : undefined) || 'Fate of the Vaal';

// poe.ninja API response types for overview
interface PoeNinjaSparkline {
  data: number[];
  totalChange: number;
}

interface PoeNinjaLine {
  id: string;
  primaryValue: number;
  volumePrimaryValue?: number;
  sparkline?: PoeNinjaSparkline;
}

interface PoeNinjaItem {
  id: string;
  name: string;
  image: string;
  category: string;
  detailsId: string;
}

interface PoeNinjaOverviewResponse {
  core: {
    rates: {
      exalted: number;
      chaos: number;
    };
    primary: string;
  };
  lines: PoeNinjaLine[];
  items: PoeNinjaItem[];
}

// Internal representation for syncing
interface PoeNinjaOverviewItem {
  id: string;
  detailsId: string;
  name: string;
  icon: string;
  category: string;
  divine: number;
  chaos: number;
  exalted: number;
  listingCount?: number;
  sparklineData?: number[];
  change7d?: number;
}

// poe.ninja API response types for details
interface PoeNinjaHistoryEntry {
  timestamp: string;
  rate: number;
  volumePrimaryValue: number;
}

interface PoeNinjaPricePair {
  id: string; // "divine", "exalted", "chaos"
  rate: number;
  volumePrimaryValue: number;
  history: PoeNinjaHistoryEntry[];
}

interface PoeNinjaDetailsResponse {
  item: {
    id: string;
    name: string;
    image: string;
    category: string;
    detailsId: string;
  };
  pairs: PoeNinjaPricePair[];
}

// Categories available in POE2 poe.ninja
const CATEGORIES = ['Currency', 'Ritual', 'Abyss'] as const;

/**
 * Map poe.ninja currency ID to our Currency enum
 */
function mapCurrency(poeNinjaCurrency: string): Currency | null {
  switch (poeNinjaCurrency.toLowerCase()) {
    case 'divine':
      return 'DIVINE';
    case 'chaos':
      return 'CHAOS';
    case 'exalted':
      return 'EXALTED';
    default:
      return null;
  }
}

/**
 * Fetch overview for a category (list of all items with basic prices)
 */
async function fetchCategoryOverview(
  category: string,
): Promise<PoeNinjaOverviewItem[]> {
  try {
    const encodedLeague = encodeURIComponent(POE_NINJA_LEAGUE);
    const url = `${POE_NINJA_BASE_URL}/overview?league=${encodedLeague}&type=${category}`;

    console.log(`Fetching category overview: ${category}`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch category ${category}: ${response.status}`);
      return [];
    }

    const data: PoeNinjaOverviewResponse = await response.json();

    // Map items by ID for easy lookup
    const itemMap = new Map(data.items.map((item) => [item.id, item]));

    // Convert rates to numbers
    const chaosRate = data.core.rates.chaos;
    const exaltedRate = data.core.rates.exalted;

    // Merge lines and items
    const overviewItems: PoeNinjaOverviewItem[] = [];
    for (const line of data.lines) {
      const item = itemMap.get(line.id);
      if (item) {
        overviewItems.push({
          id: line.id,
          detailsId: item.detailsId,
          name: item.name,
          icon: item.image,
          category: item.category,
          divine: line.primaryValue,
          chaos: line.primaryValue * chaosRate,
          exalted: line.primaryValue * exaltedRate,
          listingCount: line.volumePrimaryValue,
          sparklineData: line.sparkline?.data,
          change7d: line.sparkline?.totalChange,
        });
      }
    }

    return overviewItems;
  } catch (error) {
    console.error(`Error fetching category ${category}:`, error);
    return [];
  }
}

/**
 * Fetch detailed price history for a specific item
 */
async function fetchItemDetails(
  category: string,
  itemId: string,
): Promise<PoeNinjaDetailsResponse | null> {
  try {
    const encodedLeague = encodeURIComponent(POE_NINJA_LEAGUE);
    const url = `${POE_NINJA_BASE_URL}/details?league=${encodedLeague}&type=${category}&id=${itemId}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch item ${itemId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching item ${itemId}:`, error);
    return null;
  }
}

/**
 * Sync all market data from poe.ninja
 */
export async function syncMarketData(): Promise<{
  itemCount: number;
  error?: string;
}> {
  try {
    // Update sync status to "syncing"
    await prisma.syncStatus.upsert({
      where: { id: 'main' },
      create: { id: 'main', status: 'syncing' },
      update: { status: 'syncing', errorMsg: null },
    });

    let totalItems = 0;

    // Concurrency limit for detail fetching
    const CONCURRENCY_LIMIT = 10;
    
    // Simple p-limit implementation
    const limit = <T>(concurrency: number) => {
      const queue: (() => Promise<void>)[] = [];
      let active = 0;
      
      const next = () => {
        active--;
        if (queue.length > 0) {
          queue.shift()!();
        }
      };
      
      const run = (fn: () => Promise<T>): Promise<T> => {
        const promise = new Promise<T>((resolve, reject) => {
          const execute = async () => {
            active++;
            try {
              const result = await fn();
              resolve(result);
            } catch (err) {
              reject(err);
            } finally {
              next();
            }
          };
          
          if (active < concurrency) {
            execute();
          } else {
            queue.push(execute);
          }
        });
        return promise;
      };
      
      return run;
    };

    const runConcurrent = limit(CONCURRENCY_LIMIT);

    for (const category of CATEGORIES) {
      // Fetch all items in the category
      const items = await fetchCategoryOverview(category);

      const promises = items.map(item => runConcurrent(async () => {
        // Upsert the market item with basic info
        const marketItem = await prisma.marketItem.upsert({
          where: { externalId: item.id },
          create: {
            externalId: item.id,
            name: item.name,
            category: category,
            imageUrl: item.icon?.startsWith('http')
              ? item.icon
              : `${POE_CDN_BASE_URL}${item.icon || ''}`,
            divineRate: item.divine ?? null,
            chaosRate: item.chaos ?? null,
            exaltedRate: item.exalted ?? null,
            divineVolume: item.listingCount ?? null,
            sparklineData: item.sparklineData ?? Prisma.JsonNull,
            change7d: item.change7d ?? null,
            lastSync: new Date(),
          },
          update: {
            name: item.name,
            imageUrl: item.icon?.startsWith('http')
              ? item.icon
              : `${POE_CDN_BASE_URL}${item.icon || ''}`,
            divineRate: item.divine ?? null,
            chaosRate: item.chaos ?? null,
            exaltedRate: item.exalted ?? null,
            divineVolume: item.listingCount ?? null,
            sparklineData: item.sparklineData ?? Prisma.JsonNull,
            change7d: item.change7d ?? null,
            lastSync: new Date(),
          },
        });

        // Fetch detailed price history for this item
        const details = await fetchItemDetails(category, item.detailsId);
        
        if (details?.pairs) {
          for (const pair of details.pairs) {
            const currency = mapCurrency(pair.id);
            if (!currency || !pair.history) continue;

            const historyOps = pair.history.map(historyEntry => 
              prisma.priceHistory.upsert({
                where: {
                  itemId_timestamp_currency: {
                    itemId: marketItem.id,
                    timestamp: new Date(historyEntry.timestamp),
                    currency,
                  },
                },
                create: {
                  itemId: marketItem.id,
                  timestamp: new Date(historyEntry.timestamp),
                  rate: historyEntry.rate,
                  currency,
                  volume: historyEntry.volumePrimaryValue ?? null,
                },
                update: {
                  rate: historyEntry.rate,
                  volume: historyEntry.volumePrimaryValue ?? null,
                },
              })
            );
            await prisma.$transaction(historyOps);
          }
        }

        totalItems++;
      }));

      await Promise.all(promises);

      // Small delay between categories to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Update sync status to "idle"
    await prisma.syncStatus.update({
      where: { id: 'main' },
      data: {
        status: 'idle',
        lastSync: new Date(),
        itemCount: totalItems,
        errorMsg: null,
      },
    });

    console.log(`Sync complete: ${totalItems} items`);
    return { itemCount: totalItems };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', errorMsg);

    // Update sync status to "error"
    await prisma.syncStatus.upsert({
      where: { id: 'main' },
      create: { id: 'main', status: 'error', errorMsg },
      update: { status: 'error', errorMsg },
    });

    return { itemCount: 0, error: errorMsg };
  }
}

/**
 * Sync only overview data (faster, no history)
 */
export async function syncOverviewOnly(): Promise<{
  itemCount: number;
  error?: string;
}> {
  try {
    await prisma.syncStatus.upsert({
      where: { id: 'main' },
      create: { id: 'main', status: 'syncing' },
      update: { status: 'syncing', errorMsg: null },
    });

    let totalItems = 0;

    for (const category of CATEGORIES) {
      const items = await fetchCategoryOverview(category);

      for (const item of items) {
        await prisma.marketItem.upsert({
          where: { externalId: item.id },
          create: {
            externalId: item.id,
            name: item.name,
            category: category,
            imageUrl: item.icon?.startsWith('http')
              ? item.icon
              : `${POE_CDN_BASE_URL}${item.icon || ''}`,
            divineRate: item.divine ?? null,
            chaosRate: item.chaos ?? null,
            exaltedRate: item.exalted ?? null,
            divineVolume: item.listingCount ?? null,
            sparklineData: item.sparklineData ?? Prisma.JsonNull,
            change7d: item.change7d ?? null,
            lastSync: new Date(),
          },
          update: {
            name: item.name,
            imageUrl: item.icon?.startsWith('http')
              ? item.icon
              : `${POE_CDN_BASE_URL}${item.icon || ''}`,
            divineRate: item.divine ?? null,
            chaosRate: item.chaos ?? null,
            exaltedRate: item.exalted ?? null,
            divineVolume: item.listingCount ?? null,
            sparklineData: item.sparklineData ?? Prisma.JsonNull,
            change7d: item.change7d ?? null,
            lastSync: new Date(),
          },
        });

        totalItems++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await prisma.syncStatus.update({
      where: { id: 'main' },
      data: {
        status: 'idle',
        lastSync: new Date(),
        itemCount: totalItems,
        errorMsg: null,
      },
    });

    console.log(`Quick sync complete: ${totalItems} items`);
    return { itemCount: totalItems };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    await prisma.syncStatus.upsert({
      where: { id: 'main' },
      create: { id: 'main', status: 'error', errorMsg },
      update: { status: 'error', errorMsg },
    });

    return { itemCount: 0, error: errorMsg };
  }
}

/**
 * Get the current sync status
 */
export async function getSyncStatus() {
  return prisma.syncStatus.findUnique({
    where: { id: 'main' },
  });
}
