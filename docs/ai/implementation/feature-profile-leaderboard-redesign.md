---
phase: implementation
title: Profile & Leaderboard Redesign — Implementation Guide
description: Technical implementation details, patterns, code structure, and integration points.
feature: profile-leaderboard-redesign
---

# Implementation Guide

## Development Setup

### Prerequisites
- Node.js 18+ (already installed)
- Frontend dev server running: `cd frontend && npm run dev`
- Indexer service running at `localhost:4000`
- Aptos wallet connected (for profile testing)

### Configuration
- Smart contract address: `BINARY_OPTION_MARKET_MODULE_ADDRESS` in `/frontend/src/config/contracts.ts`
- Theme: `/frontend/src/themes/theme.ts` (Chakra UI dark theme)
- API base URL: `http://localhost:4000` (indexer)

---

## Code Structure

### New Files to Create

```
frontend/src/
├── services/
│   ├── profileService.ts          # Profile API service (NEW)
│   └── leaderboardService.ts      # Leaderboard API service (NEW)
├── components/
│   ├── shared/
│   │   ├── PnlIndicator.tsx       # P&L direction indicator (NEW)
│   │   ├── RankBadge.tsx          # Ranking badge component (NEW)
│   │   ├── AddressLink.tsx        # Wallet address display (NEW)
│   │   ├── StatCard.tsx           # Reusable stat card (NEW)
│   │   └── PaginationControls.tsx # Pagination component (NEW)
│   ├── profile/
│   │   ├── ProfileHeader.tsx      # Profile header section (NEW)
│   │   ├── MonthlySnapshot.tsx    # Monthly P&L card (NEW)
│   │   ├── StatsGrid.tsx          # Stats grid layout (NEW)
│   │   └── BettingHistory.tsx     # Betting history table (NEW)
│   └── leaderboard/
│       ├── LeaderboardHeader.tsx   # Header with metadata (NEW)
│       ├── TimeRangeSelector.tsx   # Time range toggle (NEW)
│       ├── TopThreeHighlight.tsx   # Top 3 podium (NEW)
│       ├── CategoryTabs.tsx       # Tab container (NEW)
│       └── LeaderboardTable.tsx   # Generic ranked table (NEW)
└── types/
    ├── profile.ts                 # Profile type definitions (NEW)
    └── leaderboard.ts             # Leaderboard type definitions (NEW)

frontend/pages/
├── profiles/
│   └── [addr].tsx                 # MODIFY: Complete redesign
└── leaderboards.tsx               # MODIFY: Complete redesign
```

### Files to Modify

```
frontend/pages/profiles/[addr].tsx    — Rewrite with new components
frontend/pages/leaderboards.tsx       — Rewrite with new components
frontend/pages/api/profile/[addr].ts  — May need additional proxy endpoints
```

---

## Implementation Notes

### Core Patterns

#### 1. Service Layer Pattern
All API calls go through typed service functions:

```typescript
// services/profileService.ts
const API_BASE = 'http://localhost:4000';

export async function getProfile(addr: string): Promise<ProfileData> {
  const res = await fetch(`${API_BASE}/profiles/${addr}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

export async function getBettingHistory(
  addr: string,
  page = 1,
  limit = 20,
  status?: string
): Promise<BettingHistoryResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const res = await fetch(`${API_BASE}/profiles/${addr}/history?${params}`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  return res.json();
}
```

#### 2. Component Composition Pattern
Pages are composed of independent, data-fetching-aware components:

```typescript
// pages/profiles/[addr].tsx
export default function ProfilePage() {
  const { addr } = useRouter().query;
  return (
    <Box maxW="7xl" mx="auto" p={6}>
      <ProfileHeader address={addr} />
      <MonthlySnapshot address={addr} />
      <StatsGrid address={addr} />
      <BettingHistory address={addr} />
    </Box>
  );
}
```

#### 3. Formatting Utilities
Consistent formatting for APT values, addresses, and timestamps:

```typescript
// utils/format.ts
export const formatAPT = (human: string) => {
  const n = parseFloat(human);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

export const shortenAddr = (addr: string, head = 6, tail = 4) =>
  addr.length > head + tail ? `${addr.slice(0, head)}…${addr.slice(-tail)}` : addr;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
```

---

## Integration Points

### Indexer API
- Base URL: `http://localhost:4000`
- All data is pre-aggregated by the indexer
- Frontend makes simple GET requests — no complex computations
- Error responses follow: `{ error: string, status: number }`

### Next.js API Routes (Proxy)
- Profile data is proxied through `/api/profile/[addr].ts` to avoid CORS
- May need additional proxy routes for new endpoints
- Consider using Next.js API routes for all indexer calls to centralize error handling

### Aptos Blockchain (Direct)
- `aptosMarketService.ts` for direct on-chain view function calls
- Used for real-time position checks (won't change)
- Leaderboard/profile data does NOT call on-chain directly (uses indexer)

---

## Error Handling

### Strategy
1. **Service layer**: Throw typed errors with status codes
2. **Component layer**: Catch errors, set error state, show error UI
3. **Retry**: Manual retry button on error states (no automatic retry for user-facing pages)

### Error States
```typescript
// Common error handling pattern
const [data, setData] = useState<T | null>(null);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData()
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, [deps]);
```

---

## Performance Considerations

### Data Fetching
- Parallel fetching for independent data (profile stats + history)
- Pagination for large datasets (20 items per page default)
- Loading skeletons for perceived performance

### Rendering
- Memoize expensive computations (P&L calculations, formatting)
- Use `React.memo` for pure display components (StatCard, RankBadge)
- Lazy-load chart components (recharts is heavy)

### Caching
- Browser-level: Cache leaderboard responses for 60 seconds
- Indexer-level: Pre-compute rankings every 5 minutes
- No SWR/React Query needed for current scale

---

## Security Notes

### Input Validation
- Validate wallet address format before API calls: `/^0x[a-fA-F0-9]{1,64}$/`
- Sanitize pagination params (page > 0, limit between 1 and 100)
- Sanitize time range param against allowed enum values

### Data Integrity
- All financial data comes from on-chain events (tamper-proof)
- Indexer is read-only — cannot modify blockchain state
- No authentication needed (public data only)
