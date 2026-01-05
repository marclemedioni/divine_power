# Market Data Sync

## ADDED Requirements

### Requirement: Market Data Fetch

The system SHALL periodically fetch item prices, history, and volumes from the poe.ninja API and store them in the database.

#### Scenario: Initial data sync on application start

- **WHEN** the application starts for the first time
- **THEN** the sync service fetches all available items from poe.ninja
- **AND** stores them in the MarketItem table with current prices
- **AND** stores price history in the PriceHistory table

#### Scenario: Periodic data refresh

- **WHEN** the configured sync interval (5 minutes) has elapsed
- **THEN** the system fetches updated prices from poe.ninja
- **AND** updates existing MarketItem records
- **AND** appends new entries to PriceHistory

#### Scenario: Manual sync trigger

- **WHEN** a user clicks the "Sync Now" button
- **THEN** the system immediately fetches updated data from poe.ninja
- **AND** returns the sync status with timestamp

### Requirement: Item Price Storage

The system SHALL store item information including name, category, image URL, and current prices in Divine, Chaos, and Exalted currencies.

#### Scenario: Store item with all price pairs

- **WHEN** poe.ninja returns an item with Divine, Chaos, and Exalted rates
- **THEN** the MarketItem record contains all three price values
- **AND** the volume24h field is populated

### Requirement: Price History Storage

The system SHALL store historical price data with timestamps for trend analysis.

#### Scenario: Store 23 days of price history

- **WHEN** poe.ninja returns 23 days of historical data for an item
- **THEN** 23 PriceHistory records are created for each currency pair
- **AND** each record contains timestamp, rate, and volume
