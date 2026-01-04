import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { marketRouter } from './market.router';
import { walletRouter } from './wallet.router';
import { vaultRouter } from './vault.router';
import { ordersRouter } from './orders.router';
import { tradesRouter } from './trades.router';
import { oracleRouter } from './oracle.router';

export const appRouter = router({
  // Health check / hello world
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        message: `Hello ${input?.name ?? 'World'} from Divine Power!`,
      };
    }),

  // Market data endpoints
  market: marketRouter,

  // Wallet (currency balances)
  wallet: walletRouter,

  // Vault (trading inventory)
  vault: vaultRouter,

  // Trade orders
  orders: ordersRouter,

  // Trade history
  trades: tradesRouter,

  // Oracle predictions
  oracle: oracleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
