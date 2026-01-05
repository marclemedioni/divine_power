import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { walletRouter } from './wallet.router';

export const appRouter = router({
  // Health check / hello world
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        message: `Hello ${input?.name ?? 'World'} from Divine Power!`,
      };
    }),
  wallet: walletRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
