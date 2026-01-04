# Add POE Trade Tracking System

## Summary

Build the ultimate POE trading assistant that connects to poe.ninja API to provide real-time market data, intelligent trade suggestions, and comprehensive portfolio management. The system enables traders to detect opportunities, execute trades quickly, and maximize profits.

## Problem Statement

POE trading requires constant market monitoring and quick decision-making. Currently, traders must manually check prices, track their inventory, and identify opportunities. This proposal introduces an automated system that:

- Fetches and stores market data from poe.ninja
- Tracks currency holdings (Wallet) and trading inventory (Vault)
- Manages buy/sell orders with manual execution
- Provides AI-powered trade suggestions using market metrics
- Sends notifications for trading opportunities

## Core Features

### 1. Infrastructure

- **PostgreSQL database** in Docker container
- **Prisma ORM** for type-safe database access
- **Periodic data sync** with poe.ninja API (configurable interval)

### 2. Market Data (poe.ninja Integration)

- Fetch item prices in Divine/Exalted/Chaos
- Store price history (23 days available)
- Track trading volumes
- Support all item categories (Currency, Ritual, Gems, Uniques, etc.)

### 3. Wallet System

Track owned currencies:

- Divine Orbs
- Chaos Orbs
- Exalted Orbs
- Manual balance adjustments
- Net worth calculation in primary currency

### 4. Vault System

Track items held for trading:

- Item name, quantity, cost basis
- Current market value from poe.ninja
- Unrealized P&L per item
- Purchase date and notes

### 5. Trade Orders

Bidirectional order management:

- **Buy Orders**: "Buy X when price drops to Y"
- **Sell Orders**: "Sell X when price reaches Y"
- Order status: Pending → Executed → Cancelled
- Manual order resolution
- Order history with timestamps

### 6. Trade History

Complete trade journal:

- All executed trades (buy & sell)
- Price at execution
- Realized profit/loss
- Performance metrics (win rate, average profit)

### 7. Oracle (Trade Suggestions)

Intelligent recommendations using market metrics:

- **RSI (Relative Strength Index)**: Overbought/oversold detection
- **SMA (Simple Moving Average)**: Trend analysis
- **Volatility Score**: High spread opportunities
- **Momentum**: Price acceleration detection
- **Volume Spikes**: Unusual activity alerts

Strategy types:

- **Dip Hunter**: Buy undervalued items
- **Sniper**: Quick flip opportunities
- **Arbitrage**: Currency exchange profits
- **Momentum Rider**: Follow strong trends

### 8. Notifications

Real-time alerts:

- Order price targets reached
- High-value opportunities detected
- Volume/price anomalies
- Browser notifications + in-app toasts

### 9. Dashboard

Professional Tailwind UI:

- Portfolio overview (Wallet + Vault)
- Active orders status
- Top opportunities
- Price charts with history
- P&L analytics

## Technical Stack

| Component | Technology                             |
| --------- | -------------------------------------- |
| Frontend  | Angular 21 + AnalogJS + Tailwind CSS 4 |
| Backend   | tRPC v11 + Zod validation              |
| Database  | PostgreSQL + Prisma ORM                |
| Container | Docker Compose                         |
| Testing   | Vitest (unit) + Playwright (e2e)       |
| API       | poe.ninja (external)                   |

## Proposed Phases

### Phase 1: Foundation

- Docker + PostgreSQL setup
- Prisma schema (MarketItem, Currency, PriceHistory)
- poe.ninja sync service
- Basic market data display

### Phase 2: Portfolio

- Wallet model + CRUD
- Vault model + CRUD
- Portfolio dashboard UI
- Net worth calculation

### Phase 3: Trading

- Order model (Buy/Sell)
- Order management UI
- Manual order resolution
- Trade history

### Phase 4: Intelligence

- Oracle prediction engine
- Market metrics calculation (RSI, SMA, etc.)
- Trade suggestions UI
- Notifications system

## Success Metrics

- [ ] 100% test coverage on critical paths
- [ ] < 500ms data refresh latency
- [ ] Accurate P&L calculations (5+ decimal precision)
- [ ] All strategies providing actionable suggestions

## Out of Scope (Future)

- Automatic trade execution (game integration)
- Multi-user/authentication
- Mobile app
- Historical data beyond poe.ninja limits
