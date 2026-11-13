# Code Review Findings: Profile & Leaderboard Redesign

This review covers the changes in the smart contract, backend API, and frontend components for the Profile and Leaderboard redesign.

## 🔴 Blocking Issues

### 1. Missing Database Columns in Indexer
In `api/src/routes/profiles.ts`, the following lines indicate that the database schema is not fully implemented:
```typescript
// Line 183
NULL as final_price, -- column missing in DB
// Line 185
NULL as result, -- m.resolution_outcome (column missing)
```
**Impact:** The "Betting History" table in the frontend will show `null` for strike/final prices and may incorrectly show the status of resolved markets.
**Recommendation:** Update the `markets` table schema in the database to include `final_price` (BIGINT) and `resolution_outcome` (INT/VARCHAR).

### 2. Missing Indexer Source Code
The `indexer/` directory only contains `.env`, `dist/`, and `node_modules/`. The source code for the event listener/processor is missing.
**Impact:** Without the indexer, the `bets`, `claims`, and `markets` tables will never be populated from on-chain events. The API depends entirely on these tables for history and rankings.
**Recommendation:** Restore or implement the indexer source code (e.g., in `indexer/src/index.ts`) that listens to Aptos events and syncs them to the database.

---

## 🟡 Important Issues

### 1. Hardcoded UI Elements (Frontend)
In `frontend/pages/profiles/[addr].tsx`, several profile metrics are hardcoded:
- "Level 1" (Line 161)
- "Joined Oct 2024" (Line 173)
- "Top 10% Trader" (Line 177)
- Achievements list (Lines 274-276)
**Impact:** Users will see identical metadata regardless of their actual on-chain activity.
**Recommendation:** Add fields for "join date" or "rank percentile" to the Profile API response, or explicitly label these as "Coming Soon".

### 2. Redundant Code in Smart Contract
In `sources/binary_option_market.move`, the `vector_u8_to_hex` function has a redundant declaration:
```move
// Line 504
let low = (byte & 0xF) as u64;
// ...
// Line 507
let low = (byte & 0xF) as u64;
```
**Impact:** Minor code bloat; no functional impact.
**Recommendation:** Remove the duplicate line 507.

### 3. Hardcoded Decimals
The decimals (8) are hardcoded in multiple places:
- `api/src/routes/profiles.ts` (retrieved from env, defaults to 8)
- `frontend/src/services/profileService.ts` (hardcoded to 8)
- `frontend/src/services/leaderboardService.ts` (hardcoded to 8)
**Impact:** Difficulty in supporting other coins or testnets with different decimal structures.
**Recommendation:** Ensure the frontend also pulls decimals from a shared configuration or environment variable.

---

## 🟢 Nice-to-Have / Suggestions

### 1. Combine API Queries
The `GET /profiles/:addr` endpoint executes 5 separate database queries using `Promise.all`. While concurrent, this still creates multiple round-trips to the DB.
**Recommendation:** Consider using a single SQL query with CTEs (Common Table Expressions) to fetch all profile stats in one call.

### 2. Leaderboard Query Optimization
The leaderboard queries (`api/src/routes/leaderboards.ts`) use correlated subqueries to fetch `fee_earned_raw`.
**Recommendation:** Use a `LEFT JOIN` on a pre-aggregated `owner_fees` table for better horizontal scalability.

### 3. Missing Tests
No new automated tests were found for the new API routes or the complex Smart Contract logic in `UserStatsRegistry`.
**Recommendation:** Proceed to `/writing-test` workflow to add integration tests for the P&L calculation logic.

---

## Next Steps
1. **Fix Blocking Issues**: Address the missing DB columns and restore the indexer source.
2. **Cleanup**: Fix the redundant code in the Move module.
3. **Planning**: If hardcoded UI is intentional, document the future data sources.
