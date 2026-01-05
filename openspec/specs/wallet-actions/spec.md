# wallet-actions Specification

## Purpose
TBD - created by archiving change enhance-wallet-management. Update Purpose after archive.
## Requirements
### Requirement: Currency Exchange

The system SHALL allow users to convert one currency to another, updating both balances atomically.

#### Scenario: Exchange Chaos for Divine

- **GIVEN** the user has 500 Chaos and 0 Divine
- **AND** the market rate is 100 Chaos = 1 Divine
- **WHEN** the user exchanges 200 Chaos for Divine at the market rate
- **THEN** their Chaos balance becomes 300
- **AND** their Divine balance becomes 2
- **AND** the net worth remains approximately the same (depending on exact rate used)

#### Scenario: Insufficient funds for exchange

- **GIVEN** the user has 10 Chaos
- **WHEN** the user attempts to exchange 20 Chaos
- **THEN** the system prevents the transaction
- **AND** displays an error message

#### Scenario: Exchange zero amount

- **GIVEN** the user has sufficient funds
- **WHEN** the user attempts to exchange 0 currency
- **THEN** the system prevents the transaction or disables the submit button

### Requirement: Manual Rate Override

The system SHALL allow users to override the market exchange rate during a manual exchange.

#### Scenario: Custom exchange rate

- **WHEN** the user exchanges currency
- **THEN** the exchange rate input is pre-filled with the current market rate
- **BUT** the user can edit this rate to reflect the actual transaction rate (e.g., bulk sell price)

### Requirement: Deposit Currency

The system SHALL allow users to add funds to a specific currency wallet.

#### Scenario: Deposit Funds

- **GIVEN** the user has 10 Divine
- **WHEN** the user deposits 5 Divine
- **THEN** the balance becomes 15 Divine

#### Scenario: Deposit Negative Amount

- **WHEN** the user attempts to deposit -5 Divine
- **THEN** the system prevents the transaction

### Requirement: Withdraw Currency

The system SHALL allow users to remove funds from a specific currency wallet.

#### Scenario: Withdraw Funds

- **GIVEN** the user has 10 Divine
- **WHEN** the user withdraws 3 Divine
- **THEN** the balance becomes 7 Divine

#### Scenario: Withdraw Insufficient Funds

- **GIVEN** the user has 2 Divine
- **WHEN** the user attempts to withdraw 5 Divine
- **THEN** the system prevents the transaction

#### Scenario: Withdraw All Funds

- **GIVEN** the user has 5.5 Divine
- **WHEN** the user withdraws 5.5 Divine
- **THEN** the balance becomes 0 Divine

