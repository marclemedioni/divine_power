/**
 * Orders Router - tRPC endpoints for trade order management
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';

// Schemas matching Prisma enums
const CurrencySchema = z.enum(['DIVINE', 'CHAOS', 'EXALTED']);
const OrderTypeSchema = z.enum(['BUY', 'SELL']);
const OrderStatusSchema = z.enum(['PENDING', 'EXECUTED', 'CANCELLED']);

export const ordersRouter = router({
  /**
   * Get all orders with optional filtering
   */
  getOrders: publicProcedure
    .input(
      z.object({
        status: OrderStatusSchema.optional(),
        type: OrderTypeSchema.optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { status, type, limit, offset } = input;

      const where = {
        ...(status && { status }),
        ...(type && { type }),
      };

      const [orders, total] = await Promise.all([
        prisma.tradeOrder.findMany({
          where,
          include: { item: true },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.tradeOrder.count({ where }),
      ]);

      return {
        orders: orders.map((order) => ({
          ...order,
          targetPrice: Number(order.targetPrice),
        })),
        total,
        hasMore: offset + orders.length < total,
      };
    }),

  /**
   * Get a single order by ID
   */
  getOrder: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const order = await prisma.tradeOrder.findUnique({
        where: { id: input.id },
        include: { item: true, trade: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return {
        ...order,
        targetPrice: Number(order.targetPrice),
      };
    }),

  /**
   * Create a new trade order
   */
  createOrder: publicProcedure
    .input(
      z.object({
        itemId: z.string(),
        type: OrderTypeSchema,
        quantity: z.number().int().min(1),
        targetPrice: z.number().min(0),
        currency: CurrencySchema,
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

      const order = await prisma.tradeOrder.create({
        data: {
          itemId: input.itemId,
          type: input.type,
          quantity: input.quantity,
          targetPrice: input.targetPrice,
          currency: input.currency,
          status: 'PENDING',
        },
        include: { item: true },
      });

      return {
        ...order,
        targetPrice: Number(order.targetPrice),
      };
    }),

  /**
   * Execute an order (manual resolution)
   */
  executeOrder: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        actualPrice: z.number().optional(), // If different from target price
      })
    )
    .mutation(async ({ input }) => {
      // Get the order
      const order = await prisma.tradeOrder.findUnique({
        where: { id: input.orderId },
        include: { item: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Order is not pending');
      }

      const executionPrice = input.actualPrice ?? Number(order.targetPrice);

      // Create the trade record
      const trade = await prisma.trade.create({
        data: {
          itemId: order.itemId,
          type: order.type,
          quantity: order.quantity,
          price: executionPrice,
          currency: order.currency,
          orderId: order.id,
        },
      });

      // Update the order status
      const updatedOrder = await prisma.tradeOrder.update({
        where: { id: order.id },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
        },
        include: { item: true },
      });

      // If it's a BUY order, add to vault
      if (order.type === 'BUY') {
        await prisma.vaultItem.create({
          data: {
            itemId: order.itemId,
            quantity: order.quantity,
            costBasis: executionPrice,
            costCurrency: order.currency,
          },
        });
      }

      return {
        order: {
          ...updatedOrder,
          targetPrice: Number(updatedOrder.targetPrice),
        },
        trade: {
          ...trade,
          price: Number(trade.price),
        },
      };
    }),

  /**
   * Cancel an order
   */
  cancelOrder: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const order = await prisma.tradeOrder.findUnique({
        where: { id: input.id },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.status !== 'PENDING') {
        throw new Error('Order is not pending');
      }

      const updatedOrder = await prisma.tradeOrder.update({
        where: { id: input.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: { item: true },
      });

      return {
        ...updatedOrder,
        targetPrice: Number(updatedOrder.targetPrice),
      };
    }),

  /**
   * Get pending orders that have reached their target price
   */
  getActionableOrders: publicProcedure.query(async () => {
    const pendingOrders = await prisma.tradeOrder.findMany({
      where: { status: 'PENDING' },
      include: { item: true },
    });

    const actionable = pendingOrders.filter((order) => {
      const targetPrice = Number(order.targetPrice);
      const currentPrice =
        order.currency === 'DIVINE'
          ? Number(order.item.divineRate ?? 0)
          : order.currency === 'CHAOS'
          ? Number(order.item.chaosRate ?? 0)
          : Number(order.item.exaltedRate ?? 0);

      // For BUY orders: actionable when current price <= target
      // For SELL orders: actionable when current price >= target
      if (order.type === 'BUY') {
        return currentPrice <= targetPrice && currentPrice > 0;
      } else {
        return currentPrice >= targetPrice && currentPrice > 0;
      }
    });

    return actionable.map((order) => ({
      ...order,
      targetPrice: Number(order.targetPrice),
      currentPrice:
        order.currency === 'DIVINE'
          ? Number(order.item.divineRate ?? 0)
          : order.currency === 'CHAOS'
          ? Number(order.item.chaosRate ?? 0)
          : Number(order.item.exaltedRate ?? 0),
    }));
  }),

  /**
   * Get order statistics
   */
  getStats: publicProcedure.query(async () => {
    const [pending, executed, cancelled] = await Promise.all([
      prisma.tradeOrder.count({ where: { status: 'PENDING' } }),
      prisma.tradeOrder.count({ where: { status: 'EXECUTED' } }),
      prisma.tradeOrder.count({ where: { status: 'CANCELLED' } }),
    ]);

    return {
      pending,
      executed,
      cancelled,
      total: pending + executed + cancelled,
    };
  }),
});
