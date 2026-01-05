import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { poeNinjaService } from '../../services/poe-ninja.service';
import { prisma } from '../../db';
import { TRPCError } from '@trpc/server';

// Helper to calculate standard deviation
function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Helper to calculate linear regression slope (trend)
function linearSlope(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const xSum = (n * (n - 1)) / 2;
  const ySum = values.reduce((a, b) => a + b, 0);
  const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
  const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;
  return (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
}

export interface OracleAnalysisItem {
  id: string;
  name: string;
  detailsId: string;
  image?: string;
  category: string;
  currentPrice: number;
  change24h: number;
  volume: number;
  volumeScore: number;
  trendSlope: number;
  trendDirection: 'rising' | 'falling' | 'sideways';
  volatility: number;
  tradabilityScore: number;
}

export const marketRouter = router({
  getOverview: publicProcedure
    .query(async () => {
      return await poeNinjaService.getCurrencyOverview();
    }),

  getOracleAnalysis: publicProcedure
    .query(async (): Promise<OracleAnalysisItem[]> => {
      const items = await prisma.marketItem.findMany({
        orderBy: { volumePrimaryValue: 'desc' },
        include: {
          pairs: {
            include: {
              history: {
                orderBy: { timestamp: 'desc' },
                take: 48
              }
            }
          }
        }
      });

      // Calculate max volume for normalization
      const volumes = items.map(i => i.volumePrimaryValue);
      const maxLogVolume = Math.max(...volumes.map(v => Math.log(v + 1)));

      const analysisResults: OracleAnalysisItem[] = items.map(item => {
        const divinePair = item.pairs.find(p => p.currencyId === 'divine');
        const currentPrice = divinePair?.rate ?? item.primaryValue;
        const history = divinePair?.history ?? [];
        const rates = history.map(h => h.rate).reverse(); // oldest first
        
        // Calculate 24h change
        let change24h = 0;
        if (history.length > 0) {
          const now = Date.now();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          const pastEntry = history.find(h => h.timestamp.getTime() <= oneDayAgo);
          const ref = pastEntry || history[history.length - 1];
          if (ref && ref.rate !== 0) {
            change24h = ((currentPrice - ref.rate) / ref.rate) * 100;
          }
        }

        // Volume score (normalized 0-100)
        const volumeScore = maxLogVolume > 0 
          ? (Math.log(item.volumePrimaryValue + 1) / maxLogVolume) * 100 
          : 0;

        // Trend slope and direction
        const trendSlope = linearSlope(rates);
        const avgPrice = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 1;
        const normalizedSlope = avgPrice > 0 ? (trendSlope / avgPrice) * 100 : 0;
        
        let trendDirection: 'rising' | 'falling' | 'sideways' = 'sideways';
        if (normalizedSlope > 0.5) trendDirection = 'rising';
        else if (normalizedSlope < -0.5) trendDirection = 'falling';

        // Volatility (coefficient of variation)
        const volatility = avgPrice > 0 ? (stdDev(rates) / avgPrice) * 100 : 0;

        // Tradability Score (0-100)
        // Weights: momentum 25%, volume 25%, trend 25%, volatility penalty 25%
        const momentumScore = Math.min(Math.abs(change24h) * 5, 100); // Cap at 100
        const trendScore = Math.min(Math.abs(normalizedSlope) * 10, 100); // Cap at 100
        const volatilityPenalty = Math.min(volatility * 2, 50); // Max 50 penalty
        
        const tradabilityScore = Math.max(0, Math.min(100,
          (momentumScore * 0.25) +
          (volumeScore * 0.25) +
          (trendScore * 0.25) +
          (25 - volatilityPenalty * 0.5) // Higher volatility = lower score
        ));

        return {
          id: item.id,
          name: item.name,
          detailsId: item.detailsId,
          image: item.image ?? undefined,
          category: item.category,
          currentPrice,
          change24h,
          volume: item.volumePrimaryValue,
          volumeScore,
          trendSlope: normalizedSlope,
          trendDirection,
          volatility,
          tradabilityScore
        };
      });

      // Sort by tradability score descending
      return analysisResults.sort((a, b) => b.tradabilityScore - a.tradabilityScore);
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
