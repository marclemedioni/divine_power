# Trade Orders Specification

## ADDED Requirements

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
