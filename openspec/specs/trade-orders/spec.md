# trade-orders Specification

## Purpose
TBD - created by archiving change add-trade-tracking. Update Purpose after archive.
## Requirements
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

### Requirement: Place Buy Order

The system SHALL allow users to place a Buy order for a specific item.

#### Scenario: Successful Buy Order

- **WHEN** the user places a Buy order for 10 "Divine Orb" at 150 Chaos each
- **THEN** a new "PENDING" Buy order is created in the system
- **AND** the wallet balance is NOT yet deducted

#### Scenario: Insufficient Funds

- **GIVEN** the user has 100 Chaos
- **WHEN** the user attempts to Buy 1 "Divine Orb" at 150 Chaos
- **THEN** the system prevents the order
- **AND** returns an "Insufficient funds" error

### Requirement: Execute Order (Manual)

The system SHALL allow users to manually mark an order as executed, finalizing the transaction.

#### Scenario: Execute Buy Order

- **GIVEN** a pending Buy order for 10 "Divine Orb" at 150 Chaos (Total: 1500 Chaos)
- **AND** the user has sufficient Chaos balance
- **WHEN** the user executes the order
- **THEN** the order status changes to "EXECUTED"
- **AND** 1500 Chaos is deducted from the wallet
- **AND** 10 Divine Orbs are added to the vault/wallet

#### Scenario: Execute with Insufficient Funds

- **GIVEN** a pending Buy order
- **BUT** the user has insufficient funds at execution time
- **WHEN** the user attempts to execute
- **THEN** the system prevents the execution
- **AND** displays an error message

### Requirement: Place Sell Order

The system SHALL allow users to place a Sell order for a specific item.

#### Scenario: Successful Sell Order

- **WHEN** the user places a Sell order for 5 "Voidborn Reliquary Key" at 3 Divine each
- **THEN** a new "PENDING" Sell order is created in the system

