import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        message: `Hello ${input?.name ?? 'World'} from tRPC v11!`,
      };
    }),
});

// export type definition of API
export type AppRouter = typeof appRouter;
