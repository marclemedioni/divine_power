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
  // New indicators
  rsi: number;
  bollingerUpper: number;
  bollingerLower: number;
  floorProximity: number; // % above floor
  stabilityScore: number; // 0-100
  chaosCorrelation: number; // -1 to 1
}

// Helper for RSI
function calculateRSI(prices: number[], periods = 14): number {
  if (prices.length < periods + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - periods; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  
  if (losses === 0) return 100;
  const rs = (gains / periods) / (losses / periods);
  return 100 - (100 / (1 + rs));
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
                take: 100 // Increased for Bollinger/RSI
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
        const chaosPair = item.pairs.find(p => p.currencyId === 'chaos');
        
        const currentPrice = divinePair?.rate ?? item.primaryValue;
        const history = divinePair?.history ?? [];
        const rates = history.map(h => h.rate).reverse(); // oldest first
        
        const chaosHistory = chaosPair?.history ?? [];
        const chaosRates = chaosHistory.map(h => h.rate).reverse();

        // RSI (14)
        const rsi = calculateRSI(rates, 14);

        // Bollinger Bands (20 periods, 2 stdDev)
        const bbPeriods = Math.min(rates.length, 20);
        const bbSubset = rates.slice(rates.length - bbPeriods);
        const sma = bbSubset.length > 0 ? bbSubset.reduce((a, b) => a + b, 0) / bbSubset.length : currentPrice;
        const std = stdDev(bbSubset);
        const bollingerUpper = sma + (std * 2);
        const bollingerLower = sma - (std * 2);

        // Floor Proximity (48h)
        const recentFloor = rates.length > 0 ? Math.min(...rates.slice(Math.max(0, rates.length - 48))) : currentPrice;
        const floorProximity = recentFloor > 0 ? ((currentPrice - recentFloor) / recentFloor) * 100 : 0;

        // Stability Score (Price/Volume consistency)
        // High stability if volume is consistent with price movement
        const stabilityScore = Math.max(0, 100 - (stdDev(rates.slice(-10)) / (sma || 1)) * 500);

        // Chaos Correlation
        let chaosCorrelation = 0;
        if (rates.length > 10 && chaosRates.length > 10) {
            // Simple correlation check: do both trends match in the last 10 entries?
            const divineTrend = rates[rates.length - 1] - rates[rates.length - 10];
            const chaosTrend = chaosRates[chaosRates.length - 1] - chaosRates[chaosRates.length - 10];
            if ((divineTrend > 0 && chaosTrend > 0) || (divineTrend < 0 && chaosTrend < 0)) chaosCorrelation = 1;
            else if (divineTrend === 0 || chaosTrend === 0) chaosCorrelation = 0;
            else chaosCorrelation = -1;
        }

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
        // Weights: momentum 20%, volume 20%, trend 20%, stability 20%, risk penalty (RSI/BB) 20%
        const momentumScore = Math.min(Math.abs(change24h) * 5, 100);
        const trendScore = Math.min(Math.abs(normalizedSlope) * 10, 100);
        
        // Overbought/Oversold penalties
        let riskAdjustment = 25; // Base neutral
        if (rsi > 70) riskAdjustment -= 15; // Overbought
        if (rsi < 30) riskAdjustment += 15; // Oversold (opportunity)
        if (currentPrice > bollingerUpper) riskAdjustment -= 10;
        if (currentPrice < bollingerLower) riskAdjustment += 10;

        const tradabilityScore = Math.max(0, Math.min(100,
          (momentumScore * 0.20) +
          (volumeScore * 0.20) +
          (trendScore * 0.20) +
          (stabilityScore * 0.20) +
          (riskAdjustment * 0.20 * 4) // Scale up the risk component
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
          tradabilityScore,
          rsi,
          bollingerUpper,
          bollingerLower,
          floorProximity,
          stabilityScore,
          chaosCorrelation
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
