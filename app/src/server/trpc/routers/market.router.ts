import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { poeNinjaService } from '../../services/poe-ninja.service';
import { prisma } from '../../db';
import { TRPCError } from '@trpc/server';

export const marketRouter = router({
  getOverview: publicProcedure
    .query(async () => {
      return await poeNinjaService.getCurrencyOverview();
    }),

  getItemDetails: publicProcedure
    .input(z.object({ detailsId: z.string() }))
    .query(async ({ input }) => {
      const details = await poeNinjaService.getItemDetails(input.detailsId);
      if (!details) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Item not found: ${input.detailsId}`
        });
      }
      return details;
    }),

  updateAll: publicProcedure
    .mutation(async () => {
      await poeNinjaService.updateAll();
      return { success: true };
    }),

  updatePrice: publicProcedure
    .input(z.object({
        detailsId: z.string(),
        primaryValue: z.number().positive()
    }))
    .mutation(async ({ input }) => {
        await prisma.marketItem.update({
            where: { detailsId: input.detailsId },
            data: { primaryValue: input.primaryValue }
        });
        return { success: true };
    }),
});
