import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  // Health check / hello world
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        message: `Hello ${input?.name ?? 'World'} from Divine Power!`,
      };
    })
});

// export type definition of API
export type AppRouter = typeof appRouter;
