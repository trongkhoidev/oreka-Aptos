---
phase: testing
title: Testing Strategy - Profile & Leaderboard Redesign
description: Define testing approach and verify functionality for the Profile and Leaderboard feature.
feature: profile-leaderboard-redesign
---

# Testing Strategy: Profile & Leaderboard Redesign

## Test Coverage Goals
**What level of testing do we aim for?**

- **Smart Contract (Aptos/Move):** 100% of the new `UserStatsRegistry` functions and `get_user_stats` view function.
- **Backend API (Express/PostgreSQL):** 100% of newly added routes (`/profiles/*` and `/leaderboards/*`).
- **Frontend (Next.js/Chakra UI):** Core component rendering (Shared components like StatCard, PnlIndicator) and page integration logic.
- **Alignment:** Ensure API values exactly mirror the smart contract `get_user_stats` for consistent user data.

## Unit Tests
**What individual components need testing?**

### Smart Contract (`binary_option_market.move`)
- [ ] Test case 1: Placing a bid successfully updates `total_volume` and `markets_played` in `UserStatsRegistry`.
- [ ] Test case 2: Claiming a won market correctly updates `total_winnings` and `markets_won`.
- [ ] Test case 3: `get_user_stats(user)` accurately returns `(total_volume, total_winnings, markets_played, markets_won)` for addresses with and without history.

### Backend API (`api/src/routes/profiles.ts` & `leaderboards.ts`)
- [ ] Test case 1: `GET /profiles/{addr}` accurately computes `pnl`, `roi`, `win_rate`, and the `monthly` aggregate.
- [ ] Test case 2: `GET /profiles/{addr}/history` correctly filters by `status` and `page`.
- [ ] Test case 3: `GET /leaderboards/profit` correctly sorts users by calculated profit across time ranges (`range`).
- [ ] Test case 4: `GET /leaderboards/owners/participants` distinct participant count works without timing out.

### Frontend Components (`frontend/src/components/...`)
- [ ] Test case 1: `PnlIndicator` accurately renders green arrow given positive PnL and red arrow for negative.
- [ ] Test case 2: `RankBadge` safely displays 🥇, 🥈, 🥉 for ranks 1-3.
- [ ] Test case 3: `StatCard` correctly renders icon, formatted number, label, and subtitle.

## Integration Tests
**How do we test component interactions?**

- [ ] Integration scenario 1: Creating a market, bidding, resolving, and claiming accurately reflects on the backend `/profiles/{addr}` once indexer picks up the move events.
- [ ] API endpoint tests: Missing addresses return 404 (or gracefully fallback to empty 200 payload depending on design).

## End-to-End Tests
**What user flows need validation?**

- [ ] User flow 1: User connects wallet -> Navigates to `/profile` -> Views their `MonthlySnapshot` and `StatsGrid` -> Checks their populated `BettingHistory` table for accuracy.
- [ ] User flow 2: User navigates to `/leaderboard` -> Clicks through "Today", "This Week", "All Time" -> Checks Most Profitable, Volume, and Owner tabs. Table re-renders seamlessly without UI jumping.

## Test Data
**What data do we use for testing?**

- **Database Seed:** Add mock `BidEvents`, `ClaimEvents`, and `MarketCreatedEvents` to the PostgreSQL test database mimicking months of interactions.
- **Smart Contract Localnet:** Need wallets with varying PnL characteristics: The Consistent Winner, The High Volume Loser, The Heavy Market Creator.

## Test Reporting & Coverage
**How do we verify and communicate test results?**

- No testing libraries currently set up in `api/` or `frontend/`. 
- **Recommendation:** Install `jest` for API unit testing and `@testing-library/react` for Frontend testing to automate pipeline checks.

## Manual Testing
**What requires human validation?**

- [ ] UI/UX testing checklist: Responsive layouts on Mobile, Tablet (Profile card grid breaking points).
- [ ] Verify `TimeRangeSelector` visual underline and state match. 
- [ ] Smoke tests checking loading skeleton rendering when simulating slow 3G data.

## Performance Testing
**How do we validate performance?**

- Ensure complex SQL queries containing `COUNT(DISTINCT)` and `SUM` across all-time ranges do not block threads. (Index table columns `bidder` and `market_addr` if slow).

## Bug Tracking
**How do we manage issues?**

- Bugs identified during the testing phase will be documented in `RESOLVE_FIXES_SUMMARY.md` or tracked natively via GitHub issues/tickets.

## Test Implementation Status

- **Smart Contract Move Tests**: Deferred. The Pyth price update integration in `binary_option_market::resolve_market` requires `pyth` framework testing utilities to mock off-chain price data securely. We need to implement Pyth mock setups before writing the new `resolve_market` and `get_user_stats` coverage.
- **Backend API Tests**: Deferred. Currently, no testing framework like Jest is configured in `api/`. Flagged as a follow-up task to initialize test runner and test `profiles` / `leaderboards` calculations.
- **Frontend React Tests**: Deferred. Currently, no testing framework like Playwright or React Testing Library is configured in `frontend/`. 

## Next Steps
Proceeding to `/code-review` workflow since the test strategy and coverage gaps have been fully mapped. Tests are deferred until testing tools (Jest, React Testing Library, Pyth Test Suite) are integrated into the repo.
