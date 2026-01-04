# Project Context

## Purpose

Divine Power is a Path of Exile trading assistant application designed to help players maximize profits through intelligent market analysis. The application provides:

- **Oracle Trading Assistant**: Automated trading strategy recommendations (sniper, dip hunter, arbitrage)
- **Portfolio Management**: Track owned items, cost basis, and ROI
- **Market Analysis**: Real-time price tracking via poe.ninja API integration
- **Currency Hub**: Multi-currency management and exchange rate monitoring
- **Arbitrage Scanner**: Identify profitable trading opportunities across markets

## Tech Stack

- **Framework**: Angular 21 with AnalogJS (SSR/SSG framework for Angular)
- **Build Tool**: Vite 7 with Nx 22.3.3 monorepo
- **Backend**: tRPC v11 for type-safe API with Zod validation
- **Database**: PostgreSQL (Docker) with Prisma ORM
- **Styling**: Tailwind CSS 4 with PostCSS
- **Language**: TypeScript 5.9
- **Testing**: Vitest (unit), Playwright (e2e)
- **External API**: poe.ninja for market data

## Trading Strategies

### Divine Flip Strategy

Buy items below market value and sell at market rate. Target high-volume items where price inefficiencies exist.

### Triangular Arbitrage Strategy

Exploit rate discrepancies between three currencies: **Divine Orb ↔ Item ↔ Chaos/Exalted Orb**. The cycle involves:

1. Convert currency X to an item
2. Sell item for currency Y
3. Convert Y back to X at a profit

Supported currency pairs: Divine, Chaos, Exalted Orbs.

## Project Conventions

### Code Style

- **Formatting**: Prettier with single quotes enabled
- **Linting**: ESLint with Nx and Angular plugins
- **File Naming**: kebab-case for files (e.g., `app.router.ts`, `trpc-client.ts`)
- **Component Naming**: PascalCase for classes, camelCase for functions
- **Type Imports**: Use `import type` for type-only imports (e.g., `import type { AppRouter }`)

### Architecture Patterns

- **Monorepo Structure**: Nx workspace with `app` and `app-e2e` projects
- **File-based Routing**: AnalogJS page routes in `app/src/app/pages/`
- **API Layer**: tRPC routers in `app/src/server/trpc/routers/`
- **Server Routes**: HTTP handlers in `app/src/server/routes/`
- **Separation of Concerns**: Server-side logic isolated from client components
- **Type Safety**: End-to-end type inference from backend to frontend via tRPC

### Testing Strategy

- **Unit Tests**: Vitest with `@analogjs/vitest-angular` for component testing
- **E2E Tests**: Playwright in `app-e2e/` project
- **Test Files**: Co-located with source files using `.spec.ts` extension
- **Run Tests**: `npx nx test app` (unit), `npx nx e2e app-e2e` (e2e)

### Git Workflow

- **Branching**: Feature branches for development
- **Commits**: Descriptive commit messages
- **CI**: GitHub Actions (`.github/` workflows)

## Domain Context

This application operates in the Path of Exile gaming economy context:

- **Divine Orbs**: Primary high-value currency, used as the standard unit of account
- **Chaos Orbs**: Secondary currency, often used for smaller transactions
- **Price Ratios**: Items priced as "divines per item" (expensive) or "items per divine" (cheap)
- **Market Volatility**: Prices fluctuate based on league economy and player demand
- **RSI/SMA Indicators**: Technical analysis applied to item price movements
- **Liquidity**: Measured by listing counts from poe.ninja

## Important Constraints

- **No Authentication**: Currently a personal-use application without login
- **External API Dependency**: Relies on poe.ninja API availability
- **Browser-first**: Primary experience is web-based
- **Calculation Precision**: High decimal precision (5+ places) required for ratio calculations

## External Dependencies

- **poe.ninja API**: Market price data for items and currencies
- **Nx Cloud**: Optional remote caching for builds
