# Implementation Tasks: POE Trade Tracking

## Phase 1: Foundation

### 1.1 Docker & Database Setup

- [x] Create `docker-compose.yml` with PostgreSQL 16
- [x] Add Prisma to project dependencies
- [x] Configure Prisma with PostgreSQL connection
- [x] Create initial Prisma schema with core models
- [x] Generate Prisma client
- [x] **Test**: Verify database connectivity

### 1.2 poe.ninja Integration

- [x] Create poe.ninja API service (`poe-ninja.service.ts`)
- [x] Implement item data fetching (all categories)
- [x] Implement price history parsing
- [x] Create sync scheduler (configurable interval)
- [x] Store fetched data in MarketItem + PriceHistory
- [x] **Test**: Mock API responses and verify storage

### 1.3 Market Data API

- [x] Create `market.router.ts` with tRPC procedures
- [x] Implement `getItems` with pagination/filtering
- [x] Implement `getItem` with full history
- [x] Implement `syncNow` manual trigger
- [x] Implement `getSyncStatus`
- [x] **Test**: Router unit tests

---

## Phase 2: Portfolio Management

### 2.1 Wallet System

- [x] Add Wallet model to Prisma schema
- [x] Create `wallet.router.ts`
- [x] Implement `getBalances`
- [x] Implement `updateBalance`
- [x] Implement net worth calculation
- [x] **Test**: Wallet CRUD operations

### 2.2 Wallet UI

- [x] Create `/wallet` page component
- [x] Display currency balances (Divine, Chaos, Exalted)
- [x] Add balance adjustment controls
- [x] Show net worth in primary currency
- [x] **Test**: Playwright wallet flow

### 2.3 Vault System

- [x] Add VaultItem model to Prisma schema
- [x] Create `vault.router.ts`
- [x] Implement `getItems` with current values
- [x] Implement `addItem` (purchase)
- [x] Implement `removeItem` (sold)
- [x] Calculate unrealized P&L
- [x] **Test**: Vault CRUD operations

### 2.4 Vault UI

- [x] Create `/vault` page component
- [x] Display vault items with costs and current values
- [x] Add item to vault modal
- [x] Remove item from vault action
- [x] Show unrealized P&L per item and total
- [x] **Test**: Playwright vault flow

---

## Phase 3: Trading System

### 3.1 Orders Backend

- [x] Add TradeOrder model to Prisma schema
- [x] Create `orders.router.ts`
- [x] Implement `getOrders` with filters
- [x] Implement `createOrder` (BUY/SELL)
- [x] Implement `executeOrder` (manual resolution)
- [x] Implement `cancelOrder`
- [x] **Test**: Order lifecycle tests

### 3.2 Orders UI

- [x] Create `/orders` page component
- [x] Display pending orders with targets
- [x] Highlight orders near target price
- [x] Create order modal (select item, type, target)
- [x] Execute order action with confirmation
- [x] Cancel order action
- [x] **Test**: Playwright order flow

### 3.3 Trade History

- [x] Add Trade model to Prisma schema
- [x] Link trades to executed orders
- [x] Create trade history view
- [x] Calculate realized P&L per trade
- [x] Performance metrics (win rate, avg profit)
- [x] **Test**: Trade history calculations

---

## Phase 4: Intelligence & Notifications

### 4.1 Oracle Engine

- [x] Create market metrics calculator
- [x] Implement RSI calculation (14-period)
- [x] Implement SMA calculation (7, 21 day)
- [x] Implement volatility scoring
- [x] Implement momentum detection
- [x] Implement volume spike detection
- [x] **Test**: Algorithm unit tests with known data

### 4.2 Trade Suggestions

- [x] Create `oracle.router.ts`
- [x] Implement suggestion scoring algorithm
- [x] Implement strategy filters (Dip, Sniper, etc.)
- [x] Rank and return top opportunities
- [x] Include reasoning for each suggestion
- [x] **Test**: Suggestion quality tests

### 4.3 Oracle UI

- [x] Create `/oracle` page component
- [x] Display top suggestions with scores
- [x] Strategy filter tabs
- [x] Item detail modal with metrics
- [x] Quick action: Create order from suggestion
- [x] **Test**: Playwright oracle flow

### 4.4 Notifications

- [x] Implement browser notification permission
- [x] Create notification service
- [x] Trigger on order target reached
- [x] Trigger on high-score opportunity
- [x] In-app toast notifications
- [x] **Test**: Notification triggers

---

## Phase 5: Dashboard & Polish

### 5.1 Dashboard

- [x] Design dashboard layout
- [x] Portfolio summary widget (Wallet + Vault)
- [x] Active orders widget
- [x] Top opportunities widget
- [x] Recent trades widget
- [x] Price chart component
- [x] **Test**: Playwright dashboard display

### 5.2 Market Browser

- [x] Create `/market` page component
- [x] Item list with search and category filter
- [x] Item detail page with price chart
- [x] Quick actions (add to vault, create order)
- [x] **Test**: Playwright market flow

### 5.3 Final Polish

- [x] Responsive design review
- [x] Dark mode (if not default)
- [x] Loading states and skeletons
- [x] Error handling throughout
- [x] Performance optimization
- [x] **Test**: Full E2E test suite pass

---

## Dependencies

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
   │            │            │            │
   ▼            ▼            ▼            ▼
  DB         Wallet       Orders      Oracle
  Sync       Vault        Trades      Notify
```

## Estimates

| Phase     | Complexity | Est. Time     |
| --------- | ---------- | ------------- |
| Phase 1   | Medium     | 1-2 days      |
| Phase 2   | Medium     | 1-2 days      |
| Phase 3   | High       | 2-3 days      |
| Phase 4   | High       | 2-3 days      |
| Phase 5   | Medium     | 1-2 days      |
| **Total** |            | **7-12 days** |
