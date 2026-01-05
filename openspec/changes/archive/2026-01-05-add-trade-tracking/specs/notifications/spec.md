# Notifications

## ADDED Requirements

### Requirement: Browser Notification Delivery

The system SHALL send browser notifications when important trading events occur.

#### Scenario: Notification when order target reached

- **GIVEN** a pending BUY order with targetPrice=8 Divine
- **AND** browser notifications are enabled
- **WHEN** the market price drops to 8 Divine or below
- **THEN** a browser notification is sent: "Order target reached: [Item Name] at 8 Divine"

#### Scenario: Notification for high-value opportunity

- **GIVEN** the Oracle detects an item with score > 80
- **AND** browser notifications are enabled
- **WHEN** the suggestion is generated
- **THEN** a browser notification is sent: "High opportunity: [Item Name] - [Reason]"

### Requirement: In-App Toast Display

The system SHALL display in-app toast notifications for real-time updates.

#### Scenario: Toast on successful order execution

- **WHEN** the user executes an order
- **AND** the execution is confirmed
- **THEN** a success toast appears: "Order executed successfully"

#### Scenario: Toast on data sync completion

- **WHEN** a manual sync is triggered and completes
- **THEN** a toast appears: "Market data updated - [X] items refreshed"

### Requirement: Notification Permission Request

The system SHALL request browser notification permission on first visit.

#### Scenario: First visit notification prompt

- **WHEN** the user visits the app for the first time
- **THEN** a prompt appears asking for notification permission
- **AND** the user's choice is stored for future sessions
