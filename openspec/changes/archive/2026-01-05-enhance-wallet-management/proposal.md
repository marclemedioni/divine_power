# Proposal: Enhance Wallet Management

## Goal

Improve the wallet management experience by implementing a comprehensive user interface for balance operations (Deposit, Withdraw, Update) and supporting atomic currency exchanges (e.g., Chaos ↔ Divine).

## Motivation

The current wallet implementation is minimal and lacks essential features:

- **Poor UX**: Balance updates currently rely on a native browser `prompt`, which is clunky and unprofessional.
- **Missing Functionality**: The "Quick Actions" buttons (Deposit, Withdraw, Exchange) are visually present but non-functional placeholders.
- **No Exchange Logic**: Users cannot convert between currencies within the app, forcing them to manually calculate and update two separate balances (e.g., subtracting Chaos and adding Divine manually) when they perform a currency trade.

## Proposed Changes

### Backend

- **Add `wallet.exchange` mutation**: Implement a new tRPC endpoint to handle atomic currency conversion.
  - **Inputs**: `fromCurrency`, `toCurrency`, `amount`, `rate`.
  - **Logic**: Transactionally decrease `fromCurrency` and increase `toCurrency` based on the provided rate.
  - **Validation**: Ensure sufficient funds before processing.

### Frontend

- **Transactions Modal**: Replace the native prompt with a polished, reusable modal component.
  - **Modes**:
    - **Update**: Set the absolute balance directly (useful for corrections).
    - **Deposit**: Add input amount to current balance.
    - **Withdraw**: Subtract input amount from current balance.
  - **UI**: Clean input field with currency icon, current balance display, and validation (e.g., prevent withdrawing more than available).
- **Exchange Modal**: Create a dedicated interface for currency swapping.
  - **Selection**: Dropdowns to select Source and Target currencies.
  - **Rate Handling**: Automatically fetch and pre-fill the latest market rate from `poe.ninja` data (via `netWorth` query). Allow users to manually override this rate if they got a different deal.
  - **Calculation**: Live preview of "You receive: X" based on input amount and rate.
  - **Visuals**: Arrow animation or graphic between source and target to indicate flow.

## Capabilities

- **Atomic Exchanges**: Perform multi-step balance updates (deduct X, add Y) in a single action, reducing manual arithmetic errors.
- **Enhanced Balance Management**: Intuitive Deposit/Withdraw flows that feel like a real banking app.
- **Market Integration**: seamless use of live market rates for internal conversions.
