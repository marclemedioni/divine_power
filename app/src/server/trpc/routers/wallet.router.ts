import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma, Currency } from '../../db';

// Helper to calculate and record wallet snapshot after changes
async function recordWalletSnapshot() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'default@user.com' },
      include: { 
        wallet: { 
          include: { 
            balances: true,
            inventory: { include: { marketItem: true } }
          } 
        } 
      }
    });
    
    if (!user?.wallet) return;
    
    const divBalance = user.wallet.balances.find(b => b.currency === 'DIVINE')?.amount ?? 0;
    const chaosBalance = user.wallet.balances.find(b => b.currency === 'CHAOS')?.amount ?? 0;
    const exBalance = user.wallet.balances.find(b => b.currency === 'EXALTED')?.amount ?? 0;
    
    const chaosItem = await prisma.marketItem.findUnique({ where: { detailsId: 'chaos-orb' } });
    const exItem = await prisma.marketItem.findUnique({ where: { detailsId: 'exalted-orb' } });
    
    const chaosPrice = chaosItem?.primaryValue ?? 0;
    const exPrice = exItem?.primaryValue ?? 0;
    
    let inventoryValue = 0;
    for (const inv of user.wallet.inventory) {
      if (inv.quantity > 0 && inv.marketItem.primaryValue) {
        inventoryValue += inv.quantity * inv.marketItem.primaryValue;
      }
    }
    
    const totalWealth = divBalance + (chaosBalance * chaosPrice) + (exBalance * exPrice) + inventoryValue;
    
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    const recentSnapshot = await prisma.walletSnapshot.findFirst({
      where: { walletId: user.wallet.id, timestamp: { gte: oneMinuteAgo } },
      orderBy: { timestamp: 'desc' }
    });
    
    if (!recentSnapshot || Math.abs(recentSnapshot.totalWealth - totalWealth) > 0.01) {
      await prisma.walletSnapshot.create({
        data: { walletId: user.wallet.id, totalWealth }
      });
    }
  } catch (e) {
    console.error('Failed to record wallet snapshot:', e);
  }
}
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

    if (!user.wallet) {
      throw new Error('Wallet not initialized');
    }
    return user.wallet;
  }),

  updateBalance: publicProcedure
    .input(z.object({
      currency: z.nativeEnum(Currency),
      amount: z.number().int(),
    }))
    .mutation(async ({ input }) => {
      // Ensure user and wallet exist
      const user = await prisma.user.findUnique({
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

      // Record wallet snapshot after balance change
      await recordWalletSnapshot();

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

  getWealthHistory: publicProcedure
    .input(z.object({ days: z.number().int().positive().default(30) }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: 'default@user.com' },
        include: { wallet: true }
      });
      
      if (!user?.wallet) {
        return [];
      }

      const since = new Date();
      since.setDate(since.getDate() - input.days);
      
      return await prisma.walletSnapshot.findMany({
        where: {
          walletId: user.wallet.id,
          timestamp: { gte: since }
        },
        orderBy: { timestamp: 'asc' }
      });
    }),

  recordSnapshot: publicProcedure
    .input(z.object({ totalWealth: z.number() }))
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { email: 'default@user.com' },
        include: { wallet: true }
      });
      
      if (!user?.wallet) {
        throw new Error('Wallet not found');
      }

      // Check if we already have a snapshot in the last hour to avoid spam
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const recentSnapshot = await prisma.walletSnapshot.findFirst({
        where: {
          walletId: user.wallet.id,
          timestamp: { gte: oneHourAgo }
        },
        orderBy: { timestamp: 'desc' }
      });

      // If recent snapshot exists and value is same, skip
      if (recentSnapshot && Math.abs(recentSnapshot.totalWealth - input.totalWealth) < 0.01) {
        return recentSnapshot;
      }

      return await prisma.walletSnapshot.create({
        data: {
          walletId: user.wallet.id,
          totalWealth: input.totalWealth
        }
      });
    }),
});
