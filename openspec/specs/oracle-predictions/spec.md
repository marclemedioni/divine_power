# oracle-predictions Specification

## Purpose
TBD - created by archiving change add-trade-tracking. Update Purpose after archive.
## Requirements
### Requirement: Market Metrics Calculation

The system SHALL calculate technical analysis metrics from price history data.

#### Scenario: Calculate RSI for an item

- **GIVEN** an item has 14+ days of price history
- **WHEN** the RSI is calculated
- **THEN** the result is a value between 0 and 100
- **AND** values below 30 indicate oversold
- **AND** values above 70 indicate overbought

#### Scenario: Calculate SMA for an item

- **GIVEN** an item has 7+ days of price history
- **WHEN** the SMA-7 is calculated
- **THEN** the result is the average price over the last 7 days

#### Scenario: Calculate volatility score

- **GIVEN** an item has price history
- **WHEN** the volatility is calculated
- **THEN** the result reflects the standard deviation of price changes

### Requirement: Trade Suggestion Generation

The system SHALL analyze all market items and suggest profitable trading opportunities.

#### Scenario: Dip Hunter suggestion

- **GIVEN** an item has RSI below 30 and current price below SMA-7
- **WHEN** suggestions are generated with strategy=DIP_HUNTER
- **THEN** the item appears in the suggestions
- **AND** the reason indicates "Oversold - potential rebound"

#### Scenario: Momentum suggestion

- **GIVEN** an item has strong upward price momentum and volume above average
- **WHEN** suggestions are generated with strategy=MOMENTUM
- **THEN** the item appears in the suggestions
- **AND** the reason indicates "Strong uptrend with volume"

#### Scenario: Arbitrage suggestion

- **GIVEN** an item can be bought in one currency and sold in another for profit
- **WHEN** suggestions are generated with strategy=ARBITRAGE
- **THEN** the item appears with the buy/sell currency pair
- **AND** the potential profit margin is displayed

### Requirement: Suggestion Scoring and Ranking

The system SHALL score trade suggestions based on confidence and potential profit.

#### Scenario: Sort suggestions by score

- **WHEN** multiple trade suggestions exist
- **AND** the Oracle page loads
- **THEN** suggestions are sorted by score (highest first)
- **AND** each suggestion shows a confidence score (0-100)

