/**
 * Wallet Router - tRPC endpoints for currency balance management
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';

// Currency enum matching Prisma
const CurrencySchema = z.enum(['DIVINE', 'CHAOS', 'EXALTED']);

export const walletRouter = router({
  /**
   * Get all currency balances
   */
  getBalances: publicProcedure.query(async () => {
    // Ensure all three currencies exist in the wallet
    const currencies = ['DIVINE', 'CHAOS', 'EXALTED'] as const;
    
    const balances = await Promise.all(
      currencies.map(async (currency) => {
        const wallet = await prisma.wallet.upsert({
          where: { currency },
          create: { currency, balance: 0 },
          update: {},
        });
        return wallet;
      })
    );

    return balances;
  }),

  /**
   * Update a currency balance
   */
  updateBalance: publicProcedure
    .input(
      z.object({
        currency: CurrencySchema,
        balance: z.number().min(0),
      })
    )
    .mutation(async ({ input }) => {
      const wallet = await prisma.wallet.upsert({
        where: { currency: input.currency },
        create: {
          currency: input.currency,
          balance: input.balance,
        },
        update: {
          balance: input.balance,
        },
      });

      return wallet;
    }),

  /**
   * Get net worth in primary currency (Divine)
   * Converts all currencies to Divine using current exchange rates
   */
  getNetWorth: publicProcedure.query(async () => {
    const [balances, exchangeRates] = await Promise.all([
      prisma.wallet.findMany(),
      // Get Divine Orb market item to find exchange rates
      prisma.marketItem.findFirst({
        where: { 
          OR: [
            { name: 'Divine Orb' },
            { externalId: 'divine-orb' }
          ]
        },
      }),
    ]);

    // Default rates if no market data available
    const chaosPerDivine = exchangeRates?.chaosRate ? Number(exchangeRates.chaosRate) : 50;
    const exaltedPerDivine = exchangeRates?.exaltedRate ? Number(exchangeRates.exaltedRate) : 200;

    let netWorthInDivine = 0;

    for (const wallet of balances) {
      const balance = Number(wallet.balance);
      switch (wallet.currency) {
        case 'DIVINE':
          netWorthInDivine += balance;
          break;
        case 'CHAOS':
          netWorthInDivine += balance / chaosPerDivine;
          break;
        case 'EXALTED':
          netWorthInDivine += balance / exaltedPerDivine;
          break;
      }
    }

    // Ensure we have entries for all supported currencies
    const supportedCurrencies = ['DIVINE', 'CHAOS', 'EXALTED'] as const;
    const normalizedBalances = supportedCurrencies.map(currency => {
      const found = balances.find(b => b.currency === currency);
      return {
        currency,
        balance: found ? Number(found.balance) : 0,
      };
    });

    return {
      netWorth: netWorthInDivine,
      currency: 'DIVINE' as const,
      breakdown: normalizedBalances,
      exchangeRates: {
        chaosPerDivine,
        exaltedPerDivine,
      },
    };
  }),
});
