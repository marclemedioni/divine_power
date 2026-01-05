import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { poeNinjaService } from '../../services/poe-ninja.service';

export const marketRouter = router({
  getOverview: publicProcedure
    .query(async () => {
      return await poeNinjaService.getCurrencyOverview();
    }),

  getItemDetails: publicProcedure
    .input(z.object({ detailsId: z.string() }))
    .query(async ({ input }) => {
      return await poeNinjaService.getItemDetails(input.detailsId);
    }),
});
