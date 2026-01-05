# Trade Orders

## ADDED Requirements

### Requirement: Buy and Sell Order Creation

The system SHALL allow users to create pending orders to buy or sell items at target prices.

#### Scenario: Create a buy order

- **WHEN** the user creates a BUY order for "Omen of Whittling" with quantity=3 at targetPrice=7 Divine
- **THEN** a TradeOrder is created with type=BUY, status=PENDING
- **AND** the order appears in the pending orders list

#### Scenario: Create a sell order

- **WHEN** the user creates a SELL order for quantity=5 at targetPrice=12 Divine
- **THEN** a TradeOrder is created with type=SELL, status=PENDING
- **AND** the order appears in the pending orders list

### Requirement: Manual Order Execution

The system SHALL allow users to manually mark orders as executed when the trade is completed in-game.

#### Scenario: Execute a pending order

- **WHEN** the user clicks "Execute" on a pending BUY order and confirms
- **THEN** the order status changes to EXECUTED
- **AND** executedAt timestamp is set
- **AND** the item is added to the Vault
- **AND** a Trade record is created

#### Scenario: Execute order at different price

- **GIVEN** a pending order with targetPrice=10 Divine
- **WHEN** the user executes at actualPrice=9.5 Divine
- **THEN** the Trade record uses the actual price (9.5)
- **AND** the order is marked as EXECUTED

### Requirement: Order Cancellation

The system SHALL allow users to cancel pending orders.

#### Scenario: Cancel a pending order

- **WHEN** the user clicks "Cancel" on a pending order
- **THEN** the order status changes to CANCELLED
- **AND** cancelledAt timestamp is set
- **AND** the order moves to the history view

### Requirement: Order History Tracking

The system SHALL maintain a history of all orders (executed and cancelled).

#### Scenario: View order history

- **WHEN** the user filters orders by status
- **THEN** they can see all EXECUTED orders
- **OR** all CANCELLED orders
- **OR** all PENDING orders
