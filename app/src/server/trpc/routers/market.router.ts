/**
 * Market Router - tRPC endpoints for market data
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';
import { syncMarketData, getSyncStatus } from '../../services/poe-ninja.service';

export const marketRouter = router({
  /**
   * Get all market items with optional filtering
   */
  getItems: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(500).default(100),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['name', 'divineRate', 'volume24h', 'updatedAt']).default('name'),
        sortOrder: z.enum(['asc', 'desc']).default('asc'),
      })
    )
    .query(async ({ input }) => {
      const { category, search, limit, offset, sortBy, sortOrder } = input;

      const where = {
        ...(category && { category }),
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
      };

      const [items, total] = await Promise.all([
        prisma.marketItem.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.marketItem.count({ where }),
      ]);

      return {
        items,
        total,
        hasMore: offset + items.length < total,
      };
    }),

  /**
   * Get a single market item with full price history
   */
  getItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await prisma.marketItem.findUnique({
        where: { id: input.id },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30, // Last 30 data points
          },
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      return item;
    }),

  /**
   * Get market item by external ID (poe.ninja ID)
   */
  getItemByExternalId: publicProcedure
    .input(z.object({ externalId: z.string() }))
    .query(async ({ input }) => {
      const item = await prisma.marketItem.findUnique({
        where: { externalId: input.externalId },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      return item;
    }),

  /**
   * Get all available categories
   */
  getCategories: publicProcedure.query(async () => {
    const categories = await prisma.marketItem.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map(c => c.category);
  }),

  /**
   * Trigger a manual sync with poe.ninja
   */
  syncNow: publicProcedure.mutation(async () => {
    const result = await syncMarketData();
    return result;
  }),

  /**
   * Get the current sync status
   */
  getSyncStatus: publicProcedure.query(async () => {
    const status = await getSyncStatus();
    return status ?? {
      id: 'main',
      status: 'idle',
      lastSync: null,
      itemCount: 0,
      errorMsg: null,
    };
  }),

  /**
   * Search items by name (autocomplete)
   */
  searchItems: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ input }) => {
      const items = await prisma.marketItem.findMany({
        where: {
          name: {
            contains: input.query,
            mode: 'insensitive',
          },
        },
        take: input.limit,
        select: {
          id: true,
          externalId: true,
          name: true,
          category: true,
          imageUrl: true,
          divineRate: true,
        },
      });

      return items;
    }),

  /**
   * Get market statistics
   */
  getStats: publicProcedure.query(async () => {
    const [totalItems, totalCategories, syncStatus] = await Promise.all([
      prisma.marketItem.count(),
      prisma.marketItem.findMany({
        select: { category: true },
        distinct: ['category'],
      }),
      getSyncStatus(),
    ]);

    return {
      totalItems,
      totalCategories: totalCategories.length,
      lastSync: syncStatus?.lastSync ?? null,
      syncStatus: syncStatus?.status ?? 'idle',
    };
  }),
});
