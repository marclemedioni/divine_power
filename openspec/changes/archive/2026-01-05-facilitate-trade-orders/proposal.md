# Proposal: Facilitate Trade Orders

## Why

Currently, users can view market data and their wallet balance, but there is no mechanism to place Buy or Sell orders directly in the application. This gap prevents users from acting on trading opportunities or managing their inventory strategy efficiently.

## What Changes

We will introduce the ability for users to place **Buy** and **Sell** orders for specific items.

### Features

1.  **Place Buy Order**: Users can create a request to buy a specific item at a target price (Tracking intent).
2.  **Place Sell Order**: Users can create a request to sell an owned item at a target price (Tracking intent).
3.  **Manual Execution**: Users explicitly mark an order as "Executed" when they complete the trade in-game.
    - This action creates a `Trade` record.
    - This action updates `Wallet` and `Vault` balances.
4.  **Order Validation**: Ensure sufficient funds/inventory at the time of **Execution** (soft check on creation).

### Technical Approach

- **Backend**:
  - `orders.create`: Creates `TradeOrder` (PENDING). No balance changes yet.
  - `orders.execute`: Converts `TradeOrder` to `Trade`. Updates Wallet/Vault.
- **Frontend**:
  - `OrderModalComponent`: For creating orders.
  - `ActiveOrdersComponent`: List pending orders with a "Complete" button.
