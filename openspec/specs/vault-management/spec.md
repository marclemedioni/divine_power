# vault-management Specification

## Purpose
TBD - created by archiving change add-trade-tracking. Update Purpose after archive.
## Requirements
### Requirement: Trading Inventory Tracking

The system SHALL track items purchased for resale, including quantity, cost basis, and acquisition date.

#### Scenario: Add item to vault

- **WHEN** the user purchases 5 "Omen of Whittling" at 8.5 Divine each
- **AND** adds the item to the vault
- **THEN** a VaultItem record is created with quantity=5, costBasis=8.5, costCurrency=DIVINE
- **AND** the acquiredAt timestamp is set

#### Scenario: View vault items with current values

- **WHEN** the user navigates to the Vault page
- **THEN** each item shows the original cost basis
- **AND** the current market value from poe.ninja
- **AND** the unrealized P&L (gain/loss)

### Requirement: Unrealized PnL Calculation

The system SHALL calculate the unrealized profit or loss for each vault item based on current market prices.

#### Scenario: Calculate profit on appreciated item

- **GIVEN** a VaultItem with quantity=5, costBasis=8.5 Divine
- **AND** the current market price is 10 Divine
- **WHEN** the unrealized P&L is calculated
- **THEN** the result is (10 - 8.5) \* 5 = 7.5 Divine profit

#### Scenario: Calculate loss on depreciated item

- **GIVEN** a VaultItem with quantity=3, costBasis=12 Divine
- **AND** the current market price is 9 Divine
- **WHEN** the unrealized P&L is calculated
- **THEN** the result is (9 - 12) \* 3 = -9 Divine loss

### Requirement: Vault Item Removal

The system SHALL allow users to remove items from the vault when sold.

#### Scenario: Sell item and remove from vault

- **WHEN** the user marks a VaultItem as sold
- **THEN** the VaultItem is removed from the vault
- **AND** a Trade record is created with the sale details

