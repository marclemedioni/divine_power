# Implementation Tasks: POE Trade Tracking

## Phase 1: Foundation

### 1.1 Docker & Database Setup

- [ ] Create `docker-compose.yml` with PostgreSQL 16
- [ ] Add Prisma to project dependencies
- [ ] Configure Prisma with PostgreSQL connection
- [ ] Create initial Prisma schema with core models
- [ ] Generate Prisma client
- [ ] **Test**: Verify database connectivity

### 1.2 poe.ninja Integration

- [ ] Create poe.ninja API service (`poe-ninja.service.ts`)
- [ ] Implement item data fetching (all categories)
- [ ] Implement price history parsing
- [ ] Create sync scheduler (configurable interval)
- [ ] Store fetched data in MarketItem + PriceHistory
- [ ] **Test**: Mock API responses and verify storage

### 1.3 Market Data API

- [ ] Create `market.router.ts` with tRPC procedures
- [ ] Implement `getItems` with pagination/filtering
- [ ] Implement `getItem` with full history
- [ ] Implement `syncNow` manual trigger
- [ ] Implement `getSyncStatus`
- [ ] **Test**: Router unit tests

---

## Phase 2: Portfolio Management

### 2.1 Wallet System

- [ ] Add Wallet model to Prisma schema
- [ ] Create `wallet.router.ts`
- [ ] Implement `getBalances`
- [ ] Implement `updateBalance`
- [ ] Implement net worth calculation
- [ ] **Test**: Wallet CRUD operations

### 2.2 Wallet UI

- [ ] Create `/wallet` page component
- [ ] Display currency balances (Divine, Chaos, Exalted)
- [ ] Add balance adjustment controls
- [ ] Show net worth in primary currency
- [ ] **Test**: Playwright wallet flow

### 2.3 Vault System

- [ ] Add VaultItem model to Prisma schema
- [ ] Create `vault.router.ts`
- [ ] Implement `getItems` with current values
- [ ] Implement `addItem` (purchase)
- [ ] Implement `removeItem` (sold)
- [ ] Calculate unrealized P&L
- [ ] **Test**: Vault CRUD operations

### 2.4 Vault UI

- [ ] Create `/vault` page component
- [ ] Display vault items with costs and current values
- [ ] Add item to vault modal
- [ ] Remove item from vault action
- [ ] Show unrealized P&L per item and total
- [ ] **Test**: Playwright vault flow

---

## Phase 3: Trading System

### 3.1 Orders Backend

- [ ] Add TradeOrder model to Prisma schema
- [ ] Create `orders.router.ts`
- [ ] Implement `getOrders` with filters
- [ ] Implement `createOrder` (BUY/SELL)
- [ ] Implement `executeOrder` (manual resolution)
- [ ] Implement `cancelOrder`
- [ ] **Test**: Order lifecycle tests

### 3.2 Orders UI

- [ ] Create `/orders` page component
- [ ] Display pending orders with targets
- [ ] Highlight orders near target price
- [ ] Create order modal (select item, type, target)
- [ ] Execute order action with confirmation
- [ ] Cancel order action
- [ ] **Test**: Playwright order flow

### 3.3 Trade History

- [ ] Add Trade model to Prisma schema
- [ ] Link trades to executed orders
- [ ] Create trade history view
- [ ] Calculate realized P&L per trade
- [ ] Performance metrics (win rate, avg profit)
- [ ] **Test**: Trade history calculations

---

## Phase 4: Intelligence & Notifications

### 4.1 Oracle Engine

- [ ] Create market metrics calculator
- [ ] Implement RSI calculation (14-period)
- [ ] Implement SMA calculation (7, 21 day)
- [ ] Implement volatility scoring
- [ ] Implement momentum detection
- [ ] Implement volume spike detection
- [ ] **Test**: Algorithm unit tests with known data

### 4.2 Trade Suggestions

- [ ] Create `oracle.router.ts`
- [ ] Implement suggestion scoring algorithm
- [ ] Implement strategy filters (Dip, Sniper, etc.)
- [ ] Rank and return top opportunities
- [ ] Include reasoning for each suggestion
- [ ] **Test**: Suggestion quality tests

### 4.3 Oracle UI

- [ ] Create `/oracle` page component
- [ ] Display top suggestions with scores
- [ ] Strategy filter tabs
- [ ] Item detail modal with metrics
- [ ] Quick action: Create order from suggestion
- [ ] **Test**: Playwright oracle flow

### 4.4 Notifications

- [ ] Implement browser notification permission
- [ ] Create notification service
- [ ] Trigger on order target reached
- [ ] Trigger on high-score opportunity
- [ ] In-app toast notifications
- [ ] **Test**: Notification triggers

---

## Phase 5: Dashboard & Polish

### 5.1 Dashboard

- [ ] Design dashboard layout
- [ ] Portfolio summary widget (Wallet + Vault)
- [ ] Active orders widget
- [ ] Top opportunities widget
- [ ] Recent trades widget
- [ ] Price chart component
- [ ] **Test**: Playwright dashboard display

### 5.2 Market Browser

- [ ] Create `/market` page component
- [ ] Item list with search and category filter
- [ ] Item detail page with price chart
- [ ] Quick actions (add to vault, create order)
- [ ] **Test**: Playwright market flow

### 5.3 Final Polish

- [ ] Responsive design review
- [ ] Dark mode (if not default)
- [ ] Loading states and skeletons
- [ ] Error handling throughout
- [ ] Performance optimization
- [ ] **Test**: Full E2E test suite pass

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
