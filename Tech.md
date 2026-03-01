## 1. What the project was about

This project is a production‑oriented decentralized application (dApp) that implements a professional **binary options trading platform on the Aptos blockchain**.  
Users can create on‑chain markets, place long/short positions on future price movements of crypto assets, and receive payouts fully governed by **Move smart contracts**.  

The system combines:
- On‑chain logic (market lifecycle, bids, fee accounting, payouts, event emission) written in Move on Aptos.
- A rich **Next.js / React** front‑end that visualizes markets, price charts, position timelines and user portfolios.
- Integration with multiple **Aptos wallets** and external **price oracles / data providers** (Pyth, Coinbase, Binance, CoinGecko, News APIs).  

Overall, it is an end‑to‑end DeFi product covering smart‑contract design, real‑time trading UI, and hybrid on‑chain/off‑chain data pipelines.

---

## 2. Technologies used in the project

- **Languages & Platforms**
  - Move (Aptos smart contracts)
  - TypeScript / JavaScript
  - React 18, Next.js (frontend web dApp)
  - Node.js (tooling, scripts, lightweight backend/API routes)

- **Blockchain & Smart Contracts**
  - Aptos blockchain & Aptos Framework (objects, coins, timestamp, events, view functions)
  - Move modules for:
    - Binary options markets (market registry, pool management, payout and fee logic)
    - Pyth oracle adapter and shared types
  - Move test framework for unit/integration tests of market logic

- **Frontend & UI**
  - Next.js (pages routing, API routes, SSR/SPA)
  - React with:
    - Chakra UI (component library and theming)
    - Tailwind CSS (additional utility‑first styling)
    - Framer Motion / React Spring (animations)
  - Data visualization:
    - Recharts
    - Chart.js + `react-chartjs-2`
    - Custom price and position history charts

- **Wallets & Aptos Client**
  - `@aptos-labs/ts-sdk` (Aptos client, REST, view functions, transaction building)
  - `@aptos-labs/wallet-adapter-react` and wallet‑standard integrations
  - Support for multiple Aptos wallets: Petra, Martian, Pontem, Blocto, Nightly, Particle, etc.

- **Data, Oracles & External APIs**
  - **Pyth Network** on Aptos (on‑chain price oracle for settlement)
  - Aptos fullnode REST APIs:
    - View functions (e.g. `get_all_markets`, `get_markets_by_owner`, `get_user_position`)
    - `/transactions/simulate` for gas and fee estimation
    - On‑chain event streams (e.g. bid/resolve/claim events)
  - Market data providers:
    - Coinbase REST & WebSocket feeds
    - Binance REST (ticker, klines, OHLC)
    - CoinGecko (historical prices)
  - Crypto news APIs (e.g. NewsData) for contextual market/news search

- **State Management & Data Layer**
  - SWR (data fetching & caching)
  - Redux Toolkit, `react-redux`, `redux-thunk`
  - Custom services for:
    - Market CRUD & interactions
    - Position history and event processing
    - Price/klines prefetching and caching
    - Unified on‑chain + off‑chain search

- **Architecture & Tooling**
  - Move CLI / Aptos CLI (compile, test, deploy Move packages)
  - Environment‑based network configuration (mainnet / testnet / devnet / custom)
  - TypeScript, ESLint, Prettier
  - Vercel‑compatible build scripts for deployment
  - Basic Express / `node-fetch` / CORS dependencies available for auxiliary backend endpoints

---

## 3. Key responsibilities (for your CV)

Below is a list of **typical responsibilities** for an engineer on this project.  
You should only list the items on your CV that you actually performed.

- **Smart contract design and implementation (Move / Aptos)**
  - Designed and implemented Move modules for binary options markets, including market registry, bidding, resolution and payout logic.
  - Modeled on‑chain data structures for markets, positions, fees and events to support efficient querying and analytics.
  - Integrated the Pyth oracle on Aptos and built an adapter module to safely read and transform price data for settlement.
  - Wrote and maintained Move tests to validate payout, fee distribution, market lifecycle and edge cases.

- **DeFi dApp frontend development (Next.js / React)**
  - Developed the main trading UI with market lists, detail views, owner dashboards and user profiles.
  - Built interactive components for placing bids, displaying potential PnL, and guiding users through binary options rules and timelines.
  - Implemented real‑time charts for spot price and position history using Recharts / Chart.js and custom data‑processing logic.
  - Optimized UX around error handling (RPC failures, rate limits, missing oracle data) and loading states for a DeFi audience.

- **On‑chain / off‑chain data integration**
  - Consumed Aptos fullnode APIs (view functions, events, transaction simulation) to power the dApp with live on‑chain state.
  - Implemented services to ingest and normalize data from Coinbase/Binance/CoinGecko and crypto news providers.
  - Designed caching and prefetching strategies (local storage, in‑memory caches) to reduce latency and API load for price/klines data.
  - Built search and discovery features combining on‑chain market metadata with external news and asset information.

- **Wallet, gas estimation and transaction UX**
  - Integrated multiple Aptos wallets using the standard wallet adapter, handling connection, account changes and signing flows.
  - Implemented transaction construction helpers for creating markets, bidding, resolving and claiming rewards.
  - Used Aptos transaction simulation endpoints to estimate gas usage and fees, exposing user‑friendly “gas speed” profiles (normal/fast/instant).

- **DevOps, testing and project quality**
  - Maintained Move and frontend build pipelines (compile, test, deploy) and aligned them with Aptos network configurations.
  - Configured environment variables and network selection for different environments (mainnet/testnet/devnet/custom).
  - Applied TypeScript, ESLint and Prettier to keep the codebase consistent and maintainable.
  - Wrote documentation and technical notes to help other team members understand the architecture and integration points.

