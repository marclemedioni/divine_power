import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma, Currency } from '../../db';

export const walletRouter = router({
  getWallet: publicProcedure.query(async () => {
    // Single user mode: Ensure a default user exists
    let user = await prisma.user.findUnique({
      where: { email: 'default@user.com' },
      include: { 
        wallet: { 
          include: { 
            balances: true, 
            inventory: { 
              include: { 
                marketItem: true 
              } 
            } 
          } 
        } 
      }
    });

    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email: 'default@user.com',
          name: 'Divine Exile',
        }
      });

      const newWallet = await prisma.wallet.create({
        data: {
          userId: newUser.id
        }
      });

      await prisma.balance.createMany({
        data: [
          { walletId: newWallet.id, currency: Currency.DIVINE, amount: 0 },
          { walletId: newWallet.id, currency: Currency.CHAOS, amount: 0 },
          { walletId: newWallet.id, currency: Currency.EXALTED, amount: 0 },
        ]
      });

      user = await prisma.user.findUniqueOrThrow({
        where: { id: newUser.id },
        include: { 
          wallet: { 
            include: { 
              balances: true, 
              inventory: { 
                include: { 
                  marketItem: true 
                } 
              } 
            } 
          } 
        }
      });
    }

    // Should always be there due to creation logic
    return user.wallet!;
  }),

  updateBalance: publicProcedure
    .input(z.object({
      currency: z.nativeEnum(Currency),
      amount: z.number().int(),
    }))
    .mutation(async ({ input }) => {
      // Ensure user and wallet exist
      let user = await prisma.user.findUnique({
         where: { email: 'default@user.com' },
         include: { wallet: true }
      });

      if (!user || !user.wallet) {
          throw new Error("User/Wallet not initialized. Call getWallet first.");
      }

      const wallet = await prisma.wallet.findUniqueOrThrow({
          where: { userId: user.id }
      });

      const updatedBalance = await prisma.balance.upsert({
        where: {
          walletId_currency: {
            walletId: wallet.id,
            currency: input.currency,
          },
        },
        update: {
          amount: input.amount,
        },
        create: {
          walletId: wallet.id,
          currency: input.currency,
          amount: input.amount,
        },
      });

      return updatedBalance;
    }),

  getInventoryLots: publicProcedure
    .input(z.object({ marketItemId: z.string().optional() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: 'default@user.com' },
        include: { wallet: true }
      });
      
      if (!user?.wallet) {
        throw new Error('Wallet not found');
      }
      
      return await prisma.inventoryLot.findMany({
        where: {
          walletId: user.wallet.id,
          ...(input.marketItemId ? { marketItemId: input.marketItemId } : {}),
          quantity: { gt: 0 }
        },
        include: { marketItem: true },
        orderBy: { purchasedAt: 'asc' } // FIFO order
      });
    }),
});
