# wallet-management Specification

## Purpose
TBD - created by archiving change add-trade-tracking. Update Purpose after archive.
## Requirements
### Requirement: Currency Balance Tracking

The system SHALL track the user's holdings of Divine, Chaos, and Exalted orbs.

#### Scenario: View current balances

- **WHEN** the user navigates to the Wallet page
- **THEN** they see their Divine, Chaos, and Exalted balances
- **AND** the net worth is displayed in the primary currency (Divine)

#### Scenario: Update currency balance

- **WHEN** the user enters a new balance for Divine orbs and clicks "Update"
- **THEN** the Wallet record is updated with the new balance
- **AND** the net worth recalculates

### Requirement: Net Worth Calculation

The system SHALL calculate the total net worth of all currencies converted to the primary currency using current exchange rates.

#### Scenario: Net worth calculation with exchange rates

- **GIVEN** the user has 10 Divine, 500 Chaos, and 2 Exalted
- **AND** the current rate is 50 Chaos = 1 Divine and 200 Exalted = 1 Divine
- **WHEN** the net worth is calculated
- **THEN** the result is 10 + (500/50) + (2/200) = 20.01 Divine

