
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma, Currency, OrderType, OrderStatus } from '../../db';
import { TRPCError } from '@trpc/server';

export const ordersRouter = router({
  createOrder: publicProcedure
    .input(z.object({
      marketItemId: z.string(),
      type: z.enum(OrderType),
      currency: z.enum(Currency),
      pricePerUnit: z.number().positive(),
      quantity: z.number().int().positive(),
      strategy: z.string().optional() // 'DIVINE_FLIP' or others
    }))
    .mutation(async ({ input }) => {
      // 1. Get User/Wallet
      const user = await prisma.user.findUnique({
        where: { email: 'default@user.com' },
        include: { wallet: { include: { balances: true } } }
      });
      
      if (!user?.wallet) {
         throw new TRPCError({ code: 'PRECONDITION_FAILED', message: "Wallet not initialized" });
      }
      const walletId = user.wallet.id;

      // 2. Validate Funds / Inventory
      if (input.type === OrderType.BUY) {
          const balance = user.wallet.balances.find(b => b.currency === input.currency);
          const totalCost = input.pricePerUnit * input.quantity;
          if ((balance?.amount ?? 0) < totalCost) {
               throw new TRPCError({ 
                   code: 'BAD_REQUEST', 
                   message: `Insufficient funds. Cost: ${totalCost}, Available: ${balance?.amount ?? 0}` 
               }); 
          }
      } else {
          // Validate Inventory for SELL
          const inventory = await prisma.inventory.findUnique({
              where: {
                  walletId_marketItemId: {
                      walletId,
                      marketItemId: input.marketItemId
                  }
              }
          });
          if (!inventory || inventory.quantity < input.quantity) {
             throw new TRPCError({
                 code: 'BAD_REQUEST',
                 message: `Insufficient items to sell. Owned: ${inventory?.quantity ?? 0}`
             });
          }
      }

      // 3. Create Order & Deduct Inventory if SELL
      return await prisma.$transaction(async (tx) => {
          if (input.type === OrderType.SELL) {
              await tx.inventory.update({
                  where: { walletId_marketItemId: { walletId, marketItemId: input.marketItemId } },
                  data: { quantity: { decrement: input.quantity } }
              });
          }

          const order = await tx.order.create({
            data: {
                userId: user.id,
                marketItemId: input.marketItemId,
                type: input.type,
                currency: input.currency,
                pricePerUnit: input.pricePerUnit,
                quantity: input.quantity,
                status: OrderStatus.PENDING,
            }
          });
          
          return order;
      });
    }),

  listOrders: publicProcedure
    .input(z.object({ status: z.enum(OrderStatus).optional() }))
    .query(async ({ input }) => {
      return await prisma.order.findMany({
        where: { 
            user: { email: 'default@user.com' },
            ...(input.status ? { status: input.status } : {})
        },
        include: { marketItem: true },
        orderBy: { createdAt: 'desc' }
      });
    }),

  resolveOrder: publicProcedure
    .input(z.object({
      orderId: z.string(),
      fulfilledQuantity: z.number().int().positive(),
      fulfilledPricePerUnit: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      const order = await prisma.order.findUnique({
          where: { id: input.orderId },
          include: { user: { include: { wallet: true } } }
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: "Order not found" });
      if (order.status !== OrderStatus.PENDING) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: "Order is not pending" });
      }

      if (!order.user.wallet) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const walletId = order.user.wallet.id;

      // 3. Execute Transaction logic
      await prisma.$transaction(async (tx) => {
          const totalCost = input.fulfilledPricePerUnit * input.fulfilledQuantity;

          if (order.type === OrderType.BUY) {
              // Deduct Currency
              const balance = await tx.balance.findUnique({
                  where: { walletId_currency: { walletId, currency: order.currency } }
              });

              if (!balance || balance.amount < totalCost) {
                  throw new Error("Insufficient funds at resolution time!");
              }

              await tx.balance.update({
                  where: { id: balance.id },
                  data: { amount: { decrement: Math.round(totalCost) } }
              });

              // Create new lot for this purchase
              await tx.inventoryLot.create({
                  data: {
                      walletId,
                      marketItemId: order.marketItemId,
                      quantity: input.fulfilledQuantity,
                      purchasePrice: input.fulfilledPricePerUnit,
                      orderId: order.id
                  }
              });

              // Update aggregate inventory
              await tx.inventory.upsert({
                  where: { walletId_marketItemId: { walletId, marketItemId: order.marketItemId } },
                  create: { walletId, marketItemId: order.marketItemId, quantity: input.fulfilledQuantity },
                  update: { quantity: { increment: input.fulfilledQuantity } }
              });

          } else {
              // SELL
              // Note: Inventory.quantity was already deducted at creation-time.
              // We only need to consume LOTS here.

              // Fetch lots ordered by FIFO (oldest first)
              const lots = await tx.inventoryLot.findMany({
                  where: { 
                      walletId, 
                      marketItemId: order.marketItemId,
                      quantity: { gt: 0 }
                  },
                  orderBy: { purchasedAt: 'asc' } // FIFO
              });

              let remainingToSell = input.fulfilledQuantity;
              // Check if we have enough LOT items. Usually this should be coherent with Inventory.quantity logic, 
              // but lots could be out of sync if manually edited.
              const totalLotQty = lots.reduce((acc, l) => acc + l.quantity, 0);
              if (totalLotQty < remainingToSell) {
                   throw new Error(`Insufficient lot inventory! Available Lots: ${totalLotQty}, Needed: ${remainingToSell}`);
              }

              for (const lot of lots) {
                  if (remainingToSell <= 0) break;
                  
                  const qtyFromThisLot = Math.min(lot.quantity, remainingToSell);
                  
                  // Optional: Warn if selling at loss
                  if (input.fulfilledPricePerUnit < lot.purchasePrice) {
                      console.warn(`⚠️  Selling at loss! Purchase: ${lot.purchasePrice}, Sale: ${input.fulfilledPricePerUnit}`);
                  }
                  
                  // Update or delete lot
                  if (qtyFromThisLot === lot.quantity) {
                      await tx.inventoryLot.delete({ where: { id: lot.id } });
                  } else {
                      await tx.inventoryLot.update({
                          where: { id: lot.id },
                          data: { quantity: { decrement: qtyFromThisLot } }
                      });
                  }
                  
                  remainingToSell -= qtyFromThisLot;
              }

              // Inventory.quantity adjustment for PARTIAL fill or excess?
              // The order.quantity was deducted fully.
              // We fulfilled `input.fulfilledQuantity`.
              // If we are marking the order as EXECUTED, and there is a remainder (order.quantity - fulfilledQuantity > 0), 
              // we MUST refund the remainder to Inventory.quantity.
              const remainder = order.quantity - input.fulfilledQuantity;
              if (remainder > 0) {
                 await tx.inventory.update({
                   where: { walletId_marketItemId: { walletId, marketItemId: order.marketItemId } },
                   data: { quantity: { increment: remainder } }
                 });
              }

              // Add Currency
              await tx.balance.upsert({
                  where: { walletId_currency: { walletId, currency: order.currency } },
                  create: { walletId, currency: order.currency, amount: Math.round(totalCost) },
                  update: { amount: { increment: Math.round(totalCost) } }
              });
          }

          // Update Order
          await tx.order.update({
              where: { id: order.id },
              data: {
                  status: OrderStatus.EXECUTED,
                  fulfilledQuantity: input.fulfilledQuantity,
                  fulfilledPricePerUnit: input.fulfilledPricePerUnit,
              }
          });
      });

      return { success: true };
    }),

  cancelOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input }) => {
        const order = await prisma.order.findUnique({ 
            where: { id: input.orderId },
            include: { user: { include: { wallet: true } } }
         });
        if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: "Order not found" });
        if (order.status !== OrderStatus.PENDING) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: "Can only cancel PENDING orders" });
        }

        await prisma.$transaction(async (tx) => {
            // If SELL order, refund the inventory
            if (order.type === OrderType.SELL) {
                if (!order.user.wallet) throw new Error("Wallet not found for cancellation");
                await tx.inventory.update({
                    where: { walletId_marketItemId: { walletId: order.user.wallet.id, marketItemId: order.marketItemId } },
                    data: { quantity: { increment: order.quantity } }
                });
            }

            await tx.order.update({
                where: { id: input.orderId },
                data: { status: OrderStatus.CANCELLED }
            });
        });

        return { success: true };
    })
});
