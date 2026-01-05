import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma, Currency } from '../../db';

export const walletRouter = router({
  getWallet: publicProcedure.query(async () => {
    // Single user mode: Ensure a default user exists
    let user = await prisma.user.findUnique({
      where: { email: 'default@user.com' },
      include: { wallet: { include: { balances: true } } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'default@user.com',
          name: 'Divine Exile',
          wallet: {
            create: {
              balances: {
                create: [
                  { currency: Currency.DIVINE, amount: 0 },
                  { currency: Currency.CHAOS, amount: 0 },
                  { currency: Currency.EXALTED, amount: 0 },
                ],
              },
            },
          },
        },
        include: { wallet: { include: { balances: true } } }
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

      if (!user) {
         // Should normally be handled by query first, but safe to have fallback or error
         // For simplicity, re-create or error. Let's error if basic setup isn't done, 
         // but actually fetching wallet first initiates it.
         throw new Error("User/Wallet not initialized. Call getWallet first.");
      }

      if (!user.wallet) {
         // Edge case fix
          await prisma.wallet.create({
            data: { 
                userId: user.id,
                balances: { create: [] }
            }
          });
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
});
