---
phase: requirements
title: Profile & Leaderboard Redesign — Requirements
description: Redesign the Profile and Leaderboard pages with comprehensive betting analytics, PolyMarket-inspired UI, and accurate on-chain data.
feature: profile-leaderboard-redesign
---

# Requirements & Problem Understanding

## Problem Statement

### What problem are we solving?

The current Profile page (`profiles/[addr].tsx`) displays basic aggregate statistics (markets bet, won, total bet amount, winnings, fee earned) but **lacks**:
- Monthly breakdown of performance (winnings, losses, P&L by month)
- Detailed betting history with per-market outcomes
- Visual indicators of profit trend (positive/negative month)
- Market creation analytics for owners
- A professional, PolyMarket-inspired design that builds user trust

The current Leaderboard page (`leaderboards.tsx`) only shows:
- Monthly and all-time rankings by total winnings
- A single ranking dimension (winning amount)

It **lacks**:
- Rankings by **highest volume** (biggest bettors)
- Rankings by **market owners** with most participants
- Rankings by **largest pool sizes** created
- Time-range flexibility (Today, Weekly, Monthly, All-time)
- Top performer recognition (badges, highlights)
- Real-time or daily update transparency

### Who is affected?
- **Bettors**: Need transparency into their performance, history, and standing
- **Market Creators (Owners)**: Need analytics on their markets' performance and fee income
- **Community**: Need leaderboards for social proof, strategy research, and gamification

### Current situation
- Profile page shows 6 stat cards + an activity feed table
- Leaderboard page has 2 tabs (Monthly / All-time) ranked by winnings only
- Data source: Backend API at `localhost:4000` (indexer) which aggregates on-chain events
- Smart contract emits: `BidEvent`, `ClaimEvent`, `ResolveEvent`, `WithdrawFeeEvent`, `MarketCreatedEvent`

---

## Goals & Objectives

### Primary Goals

1. **Profile Page Redesign**
   - Display comprehensive betting history with per-market breakdown
   - Show monthly performance summary: winnings, losses, net P&L, profit indicator (↑/↓)
   - Display number of markets participated in, number of markets created
   - Show win rate, ROI, and trend over time
   - PolyMarket-inspired professional UI with clean data density

2. **Leaderboard Page Redesign**
   - Rank by multiple dimensions: **Most Profitable**, **Highest Volume**, **Top Market Owners** (by participants), **Largest Pools**
   - Support time range filters: Today, Weekly, Monthly, All-time
   - Daily-updated rankings with timestamp transparency
   - Top 3 recognition with visual badges/highlights
   - Link each entry to that user's profile page

3. **Smart Contract Data Sufficiency**
   - Verify existing events provide enough data for all metrics
   - If gaps exist, add new view functions or events to the smart contract
   - Ensure the indexer can compute all required aggregations

### Secondary Goals
- Add P&L chart visualization on the profile page
- Enable users to share their profile/ranking on social media
- Support public profile viewing (any wallet address, not just connected user)

### Non-Goals (Out of Scope)
- User-settable display names, avatars, or bios (future feature)
- Social integration (Twitter linking)
- Copy-trading functionality
- Mobile-native app (responsive web only)

---

## User Stories & Use Cases

### Profile Page

- **US-P1**: As a bettor, I want to see my complete betting history (all markets I participated in, my position, outcome, and P&L for each) so I can review my performance.
- **US-P2**: As a bettor, I want to see my monthly performance summary (total wagered, total won, net P&L, win rate) so I can track my progress over time.
- **US-P3**: As a bettor, I want a clear visual indicator showing whether my month was profitable (green ↑) or unprofitable (red ↓) so I can assess at a glance.
- **US-P4**: As a market creator, I want to see how many markets I've created, total participants across my markets, and total fees earned, so I can evaluate my market-making activity.
- **US-P5**: As any user, I want to visit any wallet address's profile page and see their public on-chain performance data.

### Leaderboard Page

- **US-L1**: As a user, I want to see the top bettors ranked by net profit (P&L) for the current month so I can identify successful traders.
- **US-L2**: As a user, I want to see the highest-volume bettors (by total amount wagered) so I can identify the most active participants.
- **US-L3**: As a user, I want to see market owners ranked by total participants across their markets so I can find popular market creators.
- **US-L4**: As a user, I want to see market owners ranked by total pool size (liquidity attracted) so I can find the biggest market pools.
- **US-L5**: As a user, I want to filter leaderboards by time range (Today, Weekly, Monthly, All-time) so I can see recent performance.
- **US-L6**: As a user, I want to see the top 3 performers highlighted with special badges (🥇🥈🥉) and visual emphasis.
- **US-L7**: As a user, I want to click on any leaderboard entry to navigate to that user's profile.

### Edge Cases
- Wallet with no activity: Show empty state with "No betting history yet"
- Market with no participants: Exclude from owner rankings
- Tied rankings: Sort by secondary metric (e.g., volume as tiebreaker for P&L)
- Very large result sets: Paginate at 50 entries per page

---

## Success Criteria

### Measurable Outcomes
1. Profile page displays: betting history (per-market), monthly summary, P&L indicator, markets created, markets participated, win rate, total volume, total winnings
2. Leaderboard page displays 4 ranking categories with time-range filtering
3. All data is sourced from on-chain events via the indexer API — no mock data
4. Top 3 in each category receive visual recognition
5. Page load time < 3 seconds for profile and leaderboard pages

### Acceptance Criteria
- [ ] Profile page loads with all required data sections for any valid wallet address
- [ ] Monthly P&L shows green/red indicator correctly
- [ ] Betting history table shows all past market participations with outcome details
- [ ] Leaderboard shows 4 tabs/categories with working time-range filter
- [ ] Rankings update at least daily
- [ ] Clicking a leaderboard entry navigates to that user's profile
- [ ] Empty states are handled gracefully

---

## Constraints & Assumptions

### Technical Constraints
- Smart contract is deployed on **Aptos mainnet** — changes require redeployment
- Frontend uses **Next.js** (Pages Router) with **Chakra UI**
- Backend indexer API runs at `localhost:4000` — all aggregation happens there
- On-chain event data is the single source of truth
- Rate limits on Aptos fullnode API (429 handling already implemented)

### Assumptions
- The existing events (`BidEvent`, `ClaimEvent`, `ResolveEvent`, `WithdrawFeeEvent`, `MarketCreatedEvent`) contain sufficient fields for all required aggregations
- The indexer already processes and stores these events
- Monthly calculations use UTC+7 timezone (existing convention)
- "Profit" = claim amount - original bid amount (net after fees)

### Data Sufficiency Analysis

| Metric | Source Event(s) | Available? |
|--------|----------------|------------|
| Betting history per user | `BidEvent` (user, market, amount, prediction, timestamp) | ✅ Yes |
| Win/loss per market | `ClaimEvent` (user, amount, won) + `ResolveEvent` (result) | ✅ Yes |
| Monthly winnings | `ClaimEvent` filtered by month | ✅ Yes |
| Monthly bet volume | `BidEvent` filtered by month | ✅ Yes |
| Net P&L | `ClaimEvent.amount` - `BidEvent.amount` per user | ✅ Yes (computed) |
| Markets participated | Count distinct `BidEvent.market_address` per user | ✅ Yes |
| Markets created | `MarketCreatedEvent` per creator | ✅ Yes |
| Total participants per owner | Count distinct `BidEvent.user` per owner's markets | ✅ Yes (join needed) |
| Pool size per owner | Sum `Market.total_amount` per owner's markets | ✅ Yes |
| Fee earned | `WithdrawFeeEvent.amount` per owner | ✅ Yes |

**Conclusion**: No smart contract changes needed. All metrics can be computed from existing events by the indexer.

---

## Questions & Open Items

1. **Indexer API endpoints**: Do the new aggregation endpoints already exist, or do we need to add them to the indexer? (Likely need new endpoints for: monthly profile summary, leaderboard by volume, leaderboard by owner participants, leaderboard by pool size)
2. **Update frequency**: Should leaderboard data be real-time (event-driven) or batched (e.g., daily snapshots)?
3. **Pagination**: Should we implement infinite scroll or traditional pagination for leaderboard/history?
4. **Profile privacy**: Should profiles always be public, or should users have an opt-out option?
5. **Chart library**: Which chart library to use for P&L visualization? (recharts is already available in the project)
