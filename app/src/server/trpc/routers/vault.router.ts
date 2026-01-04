/**
 * Vault Router - tRPC endpoints for trading inventory management
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';

// Currency enum matching Prisma
const CurrencySchema = z.enum(['DIVINE', 'CHAOS', 'EXALTED']);

export const vaultRouter = router({
  /**
   * Get all vault items with current market values
   */
  getItems: publicProcedure.query(async () => {
    const items = await prisma.vaultItem.findMany({
      include: {
        item: true, // Include linked MarketItem for current prices
      },
      orderBy: { acquiredAt: 'desc' },
    });

    // Calculate unrealized P&L for each item
    return items.map((vaultItem) => {
      const costBasis = Number(vaultItem.costBasis);
      const currentRate = vaultItem.costCurrency === 'DIVINE'
        ? Number(vaultItem.item.divineRate ?? 0)
        : vaultItem.costCurrency === 'CHAOS'
        ? Number(vaultItem.item.chaosRate ?? 0)
        : Number(vaultItem.item.exaltedRate ?? 0);

      const totalCost = costBasis * vaultItem.quantity;
      const currentValue = currentRate * vaultItem.quantity;
      const unrealizedPnL = currentValue - totalCost;
      const pnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

      return {
        ...vaultItem,
        costBasis,
        currentRate,
        totalCost,
        currentValue,
        unrealizedPnL,
        pnLPercent,
      };
    });
  }),

  /**
   * Add item to vault (record a purchase)
   */
  addItem: publicProcedure
    .input(
      z.object({
        itemId: z.string(), // MarketItem ID
        quantity: z.number().int().min(1),
        costBasis: z.number().min(0), // Price paid per unit
        costCurrency: CurrencySchema,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Verify the market item exists
      const marketItem = await prisma.marketItem.findUnique({
        where: { id: input.itemId },
      });

      if (!marketItem) {
        throw new Error('Market item not found');
      }

      const vaultItem = await prisma.vaultItem.create({
        data: {
          itemId: input.itemId,
          quantity: input.quantity,
          costBasis: input.costBasis,
          costCurrency: input.costCurrency,
          notes: input.notes,
        },
        include: {
          item: true,
        },
      });

      return vaultItem;
    }),

  /**
   * Update vault item (adjust quantity or notes)
   */
  updateItem: publicProcedure
    .input(
      z.object({
        id: z.string(),
        quantity: z.number().int().min(1).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const vaultItem = await prisma.vaultItem.update({
        where: { id: input.id },
        data: {
          ...(input.quantity !== undefined && { quantity: input.quantity }),
          ...(input.notes !== undefined && { notes: input.notes }),
        },
        include: {
          item: true,
        },
      });

      return vaultItem;
    }),

  /**
   * Remove item from vault (sold or disposed)
   */
  removeItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const vaultItem = await prisma.vaultItem.delete({
        where: { id: input.id },
      });

      return vaultItem;
    }),

  /**
   * Get total unrealized P&L across all vault items
   */
  getTotalUnrealizedPnL: publicProcedure.query(async () => {
    const items = await prisma.vaultItem.findMany({
      include: { item: true },
    });

    let totalCost = 0;
    let totalCurrentValue = 0;

    for (const vaultItem of items) {
      const costBasis = Number(vaultItem.costBasis);
      const currentRate = vaultItem.costCurrency === 'DIVINE'
        ? Number(vaultItem.item.divineRate ?? 0)
        : vaultItem.costCurrency === 'CHAOS'
        ? Number(vaultItem.item.chaosRate ?? 0)
        : Number(vaultItem.item.exaltedRate ?? 0);

      totalCost += costBasis * vaultItem.quantity;
      totalCurrentValue += currentRate * vaultItem.quantity;
    }

    const unrealizedPnL = totalCurrentValue - totalCost;
    const pnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      totalCost,
      totalCurrentValue,
      unrealizedPnL,
      pnLPercent,
      itemCount: items.length,
    };
  }),

  /**
   * Get vault statistics
   */
  getStats: publicProcedure.query(async () => {
    const items = await prisma.vaultItem.findMany({
      include: { item: true },
    });

    // Group by category
    const byCategory = items.reduce((acc, vaultItem) => {
      const category = vaultItem.item.category;
      if (!acc[category]) {
        acc[category] = { count: 0, totalValue: 0 };
      }
      acc[category].count += vaultItem.quantity;
      acc[category].totalValue += Number(vaultItem.costBasis) * vaultItem.quantity;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    return {
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      uniqueItems: items.length,
      byCategory,
    };
  }),
});
