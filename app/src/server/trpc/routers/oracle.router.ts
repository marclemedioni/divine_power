/**
 * Oracle Router - tRPC endpoints for trade predictions and market analysis
 */

import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { prisma } from '../../db';

// Strategy types for Oracle suggestions
const StrategySchema = z.enum(['ALL', 'DIP_HUNTER', 'SNIPER', 'ARBITRAGE', 'MOMENTUM']);

/**
 * Calculate RSI (Relative Strength Index) from price history
 * RSI < 30 = oversold, RSI > 70 = overbought
 */
function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50; // Neutral if not enough data

  const changes = prices.slice(0, period + 1).map((price, i) => 
    i === 0 ? 0 : price - prices[i - 1]
  ).slice(1);

  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[0] ?? 0;
  const slice = prices.slice(0, period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate volatility (standard deviation of price changes)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  const changes = prices.slice(0, -1).map((price, i) => 
    (prices[i + 1] - price) / price
  );
  
  const mean = changes.reduce((a, b) => a + b, 0) / changes.length;
  const squaredDiffs = changes.map(c => Math.pow(c - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / changes.length);
}

/**
 * Calculate momentum (rate of price change)
 */
function calculateMomentum(prices: number[], period = 7): number {
  if (prices.length < period) return 0;
  const currentPrice = prices[0];
  const pastPrice = prices[period - 1];
  return pastPrice > 0 ? ((currentPrice - pastPrice) / pastPrice) * 100 : 0;
}

export const oracleRouter = router({
  /**
   * Get trade suggestions based on market analysis
   */
  getSuggestions: publicProcedure
    .input(
      z.object({
        strategy: StrategySchema.default('ALL'),
        limit: z.number().min(1).max(50).default(20),
        minVolume: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      // Get all market items with price history
      const items = await prisma.marketItem.findMany({
        where: {
          divineRate: { not: null },
          ...(input.minVolume && { volume24h: { gte: input.minVolume } }),
        },
        include: {
          priceHistory: {
            where: { currency: 'DIVINE' },
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });

      // Calculate metrics and score each item
      const suggestions = items.map((item) => {
        const prices = item.priceHistory.map((h) => Number(h.rate)).reverse();
        const currentPrice = Number(item.divineRate ?? 0);
        const volume = Number(item.volume24h ?? 0);

        // Calculate all metrics
        const rsi = calculateRSI(prices);
        const sma7 = calculateSMA(prices, 7);
        const sma21 = calculateSMA(prices, 21);
        const volatility = calculateVolatility(prices);
        const momentum = calculateMomentum(prices);
        const volumeChange = prices.length > 7 
          ? volume / (item.priceHistory.slice(-7).reduce((s, h) => s + Number(h.volume ?? 0), 0) / 7 || 1)
          : 1;

        // Determine strategy signals
        const signals = {
          dipHunter: rsi < 30 && currentPrice < sma7,
          momentum: momentum > 10 && rsi > 50 && volumeChange > 1.2,
          arbitrage: volatility > 0.1 && volume > 100,
          sniper: rsi < 40 && currentPrice < sma21 * 0.95 && volume > 50,
        };

        // Calculate composite score (0-100)
        let score = 50; // Start neutral
        let reason = '';

        if (signals.dipHunter) {
          score += 25;
          reason = 'Oversold - potential rebound';
        }
        if (signals.momentum) {
          score += 20;
          reason = reason || 'Strong uptrend with volume';
        }
        if (signals.sniper) {
          score += 20;
          reason = reason || 'Below average - quick flip opportunity';
        }
        if (signals.arbitrage) {
          score += 15;
          reason = reason || 'High volatility spread opportunity';
        }
        if (volume > 1000) score += 10; // Liquidity bonus
        if (volatility > 0.05 && volatility < 0.2) score += 5; // Healthy volatility

        score = Math.min(100, Math.max(0, score));

        return {
          item,
          metrics: {
            rsi: Math.round(rsi * 10) / 10,
            sma7: Math.round(sma7 * 100) / 100,
            sma21: Math.round(sma21 * 100) / 100,
            volatility: Math.round(volatility * 1000) / 1000,
            momentum: Math.round(momentum * 10) / 10,
            volumeChange: Math.round(volumeChange * 100) / 100,
          },
          signals,
          score: Math.round(score),
          reason: reason || 'Market neutral',
          suggestedAction: score > 70 ? 'BUY' : score < 30 ? 'SELL' : 'HOLD',
          currentPrice,
          priceHistory: prices.slice(0, 14),
        };
      });

      // Filter by strategy if specified
      let filtered = suggestions;
      if (input.strategy !== 'ALL') {
        filtered = suggestions.filter((s) => {
          switch (input.strategy) {
            case 'DIP_HUNTER':
              return s.signals.dipHunter;
            case 'MOMENTUM':
              return s.signals.momentum;
            case 'SNIPER':
              return s.signals.sniper;
            case 'ARBITRAGE':
              return s.signals.arbitrage;
            default:
              return true;
          }
        });
      }

      // Sort by score and return top suggestions
      return filtered
        .sort((a, b) => b.score - a.score)
        .slice(0, input.limit);
    }),

  /**
   * Get detailed metrics for a specific item
   */
  getItemMetrics: publicProcedure
    .input(z.object({ itemId: z.string() }))
    .query(async ({ input }) => {
      const item = await prisma.marketItem.findUnique({
        where: { id: input.itemId },
        include: {
          priceHistory: {
            where: { currency: 'DIVINE' },
            orderBy: { timestamp: 'desc' },
            take: 30,
          },
        },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      const prices = item.priceHistory.map((h) => Number(h.rate)).reverse();
      const currentPrice = Number(item.divineRate ?? 0);

      return {
        item,
        metrics: {
          currentPrice,
          rsi: calculateRSI(prices),
          sma7: calculateSMA(prices, 7),
          sma21: calculateSMA(prices, 21),
          volatility: calculateVolatility(prices),
          momentum: calculateMomentum(prices),
          priceChange24h: prices.length >= 2 
            ? ((prices[0] - prices[1]) / prices[1]) * 100 
            : 0,
          priceChange7d: prices.length >= 7 
            ? ((prices[0] - prices[6]) / prices[6]) * 100 
            : 0,
          high7d: prices.length >= 7 ? Math.max(...prices.slice(0, 7)) : currentPrice,
          low7d: prices.length >= 7 ? Math.min(...prices.slice(0, 7)) : currentPrice,
        },
        priceHistory: item.priceHistory.map((h) => ({
          timestamp: h.timestamp,
          rate: Number(h.rate),
          volume: Number(h.volume ?? 0),
        })),
      };
    }),

  /**
   * Get market overview statistics
   */
  getMarketOverview: publicProcedure.query(async () => {
    const items = await prisma.marketItem.findMany({
      where: { divineRate: { not: null } },
      include: {
        priceHistory: {
          where: { currency: 'DIVINE' },
          orderBy: { timestamp: 'desc' },
          take: 2,
        },
      },
    });

    // Calculate market-wide metrics
    let gainers = 0;
    let losers = 0;
    let unchanged = 0;

    const movers = items.map((item) => {
      const current = Number(item.divineRate ?? 0);
      const previous = item.priceHistory[1] ? Number(item.priceHistory[1].rate) : current;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      if (change > 1) gainers++;
      else if (change < -1) losers++;
      else unchanged++;

      return { item, current, previous, change };
    });

    const topGainers = movers
      .filter((m) => m.change > 0)
      .sort((a, b) => b.change - a.change)
      .slice(0, 5);

    const topLosers = movers
      .filter((m) => m.change < 0)
      .sort((a, b) => a.change - b.change)
      .slice(0, 5);

    return {
      totalItems: items.length,
      gainers,
      losers,
      unchanged,
      marketSentiment: gainers > losers ? 'BULLISH' : losers > gainers ? 'BEARISH' : 'NEUTRAL',
      topGainers: topGainers.map((m) => ({
        id: m.item.id,
        name: m.item.name,
        category: m.item.category,
        imageUrl: m.item.imageUrl,
        currentPrice: m.current,
        change: Math.round(m.change * 10) / 10,
      })),
      topLosers: topLosers.map((m) => ({
        id: m.item.id,
        name: m.item.name,
        category: m.item.category,
        imageUrl: m.item.imageUrl,
        currentPrice: m.current,
        change: Math.round(m.change * 10) / 10,
      })),
    };
  }),
});
