/**
 * Trades Router - tRPC endpoints for trade history
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';

// Schemas matching Prisma enums
const OrderTypeSchema = z.enum(['BUY', 'SELL']);

export const tradesRouter = router({
  /**
   * Get all executed trades
   */
  getTrades: publicProcedure
    .input(
      z.object({
        type: OrderTypeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { type, limit, offset } = input;

      const where = {
        ...(type && { type }),
      };

      const [trades, total] = await Promise.all([
        prisma.trade.findMany({
          where,
          include: { item: true },
          take: limit,
          skip: offset,
          orderBy: { executedAt: 'desc' },
        }),
        prisma.trade.count({ where }),
      ]);

      return {
        trades: trades.map((trade) => ({
          ...trade,
          price: Number(trade.price),
        })),
        total,
        hasMore: offset + trades.length < total,
      };
    }),

  /**
   * Get a single trade by ID
   */
  getTrade: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const trade = await prisma.trade.findUnique({
        where: { id: input.id },
        include: { item: true, order: true },
      });

      if (!trade) {
        throw new Error('Trade not found');
      }

      return {
        ...trade,
        price: Number(trade.price),
      };
    }),

  /**
   * Create a manual trade (without order)
   */
  createTrade: publicProcedure
    .input(
      z.object({
        itemId: z.string(),
        type: OrderTypeSchema,
        quantity: z.number().int().min(1),
        price: z.number().min(0),
        currency: z.enum(['DIVINE', 'CHAOS', 'EXALTED']),
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

      const trade = await prisma.trade.create({
        data: {
          itemId: input.itemId,
          type: input.type,
          quantity: input.quantity,
          price: input.price,
          currency: input.currency,
          notes: input.notes,
        },
        include: { item: true },
      });

      // If it's a BUY trade, add to vault
      if (input.type === 'BUY') {
        await prisma.vaultItem.create({
          data: {
            itemId: input.itemId,
            quantity: input.quantity,
            costBasis: input.price,
            costCurrency: input.currency,
          },
        });
      }

      return {
        ...trade,
        price: Number(trade.price),
      };
    }),

  /**
   * Get trade performance metrics
   */
  getPerformance: publicProcedure.query(async () => {
    const trades = await prisma.trade.findMany({
      include: { item: true },
    });

    // Group trades by item to calculate P&L
    const itemTrades = trades.reduce((acc, trade) => {
      const key = `${trade.itemId}-${trade.currency}`;
      if (!acc[key]) {
        acc[key] = { buys: [], sells: [], item: trade.item };
      }
      if (trade.type === 'BUY') {
        acc[key].buys.push(trade);
      } else {
        acc[key].sells.push(trade);
      }
      return acc;
    }, {} as Record<string, { buys: typeof trades; sells: typeof trades; item: typeof trades[0]['item'] }>);

    // Calculate realized P&L (simplified FIFO)
    let totalRealizedPnL = 0;
    let totalBuyVolume = 0;
    let totalSellVolume = 0;

    for (const group of Object.values(itemTrades)) {
      for (const sell of group.sells) {
        const sellPrice = Number(sell.price);
        const sellQty = sell.quantity;
        
        // Find average buy cost
        const avgBuyCost = group.buys.length > 0
          ? group.buys.reduce((sum, b) => sum + Number(b.price) * b.quantity, 0) /
            group.buys.reduce((sum, b) => sum + b.quantity, 0)
          : 0;

        totalRealizedPnL += (sellPrice - avgBuyCost) * sellQty;
        totalSellVolume += sellPrice * sellQty;
      }

      for (const buy of group.buys) {
        totalBuyVolume += Number(buy.price) * buy.quantity;
      }
    }

    // Win rate calculation
    const winningTrades = Object.values(itemTrades).filter((group) => {
      if (group.sells.length === 0 || group.buys.length === 0) return false;
      const avgBuyCost = group.buys.reduce((sum, b) => sum + Number(b.price) * b.quantity, 0) /
        group.buys.reduce((sum, b) => sum + b.quantity, 0);
      const avgSellPrice = group.sells.reduce((sum, s) => sum + Number(s.price) * s.quantity, 0) /
        group.sells.reduce((sum, s) => sum + s.quantity, 0);
      return avgSellPrice > avgBuyCost;
    }).length;

    const totalClosedPositions = Object.values(itemTrades).filter(
      (g) => g.sells.length > 0 && g.buys.length > 0
    ).length;

    return {
      totalTrades: trades.length,
      buyTrades: trades.filter((t) => t.type === 'BUY').length,
      sellTrades: trades.filter((t) => t.type === 'SELL').length,
      totalBuyVolume,
      totalSellVolume,
      realizedPnL: totalRealizedPnL,
      winRate: totalClosedPositions > 0 ? (winningTrades / totalClosedPositions) * 100 : 0,
      closedPositions: totalClosedPositions,
    };
  }),

  /**
   * Get recent trades
   */
  getRecentTrades: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }))
    .query(async ({ input }) => {
      const trades = await prisma.trade.findMany({
        include: { item: true },
        orderBy: { executedAt: 'desc' },
        take: input.limit,
      });

      return trades.map((trade) => ({
        ...trade,
        price: Number(trade.price),
      }));
    }),
});
