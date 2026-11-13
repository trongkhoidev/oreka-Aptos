# OREKA Binary Options — Project Operations & Documentation

Welcome to the comprehensive guide for **OREKA**, a professional decentralized binary options trading platform built on the **Aptos Blockchain**. This document provides an in-depth look at how the project operates, its technical architecture, and its market logic.

---

## 1. Project Overview

OREKA is a high-performance DeFi platform that allows users to trade on the future price movements of crypto assets (BTC, ETH, APT, etc.) with fixed risk and fixed reward. 

- **Core Concept**: Users predict if a price will be higher (Long) or lower (Short) than a strike price at a specific maturity time.
- **Settlement**: Fully decentralized settlement powered by **Pyth Network** on-chain oracles.
- **Governance**: All market logic is handled by the **Move VM**, ensuring transparency and security.

---

## 2. Technical Architecture

The platform is divided into three main layers:

### A. Smart Contracts (Move on Aptos)
The single source of truth for the platform.
- **Market Registry**: Manages the deployment and indexing of all binary option markets.
- **Lifecycle Management**: Handles the transition from Bidding -> Maturity -> Resolution.
- **Vault System**: Securely holds user bids and payouts in individual market objects.
- **Fee Distribution**: Automatically calculates and distributes fees to market owners.

### B. Backend (Indexer & API)
A high-fidelity data layer that mirrors on-chain state for performant querying.
- **Indexer**: Listens to `BidEvent`, `ClaimEvent`, and `ResolveEvent` on the Aptos network.
- **Database**: PostgreSQL database stores historical data for user P&L, volume, and leaderboards.
- **Rest API**: High-performance JSON API providing enriched data to the frontend.

### C. Frontend (Next.js & Chakra UI)
A premium trading interface inspired by top-tier financial dashboards.
- **Real-time Feeds**: WebSocket and REST integrations for live price charts.
- **Wallet Adapter**: Seamless connection to Petra, Martian, Pontem, and other Aptos wallets.
- **Analytics**: Comprehensive profile pages with on-chain performance tracking (Win Rate, ROI, P&L Trend).

---

## 3. Market Mechanics

### Market Lifecycle
1. **Creation**: An owner creates a market with a trading pair (e.g., BTC/USD), strike price, maturity time, and fee.
2. **Bidding Phase**: Users place "Long" or "Short" bids using APT or other supported coins.
3. **Maturity**: The market stops accepting bids and waits for the maturity timestamp.
4. **Resolution**: The Pyth Oracle provides the final price. The market is resolved as `LONG_WIN` or `SHORT_WIN`.
5. **Claims**: Winners can claim their portion of the pool proportional to their bid.

### Fee Structure
- **Market Owner Fee**: A percentage set by the creator (e.g., 2%).
- **Protocol Fee**: (If applicable) helps sustain the platform infrastructure.

---

## 4. User Guide

### For Traders
1. **Connect Wallet**: Use the "Connect Wallet" button in the header.
2. **Browse Markets**: Use the "Markets" page to find active trading opportunities.
3. **Place Bid**: Choose Long or Short, enter your amount, and confirm the transaction.
4. **Monitor**: Check your "Profile" to see active positions and historical performance.
5. **Claim**: If you win, go to the market page or your profile to claim rewards.

### For Market Creators (Owners)
1. **Create Market**: Use the "Create Market" dashboard.
2. **Set Parameters**: Carefully choose maturity times and strike prices to attract liquidity.
3. **Collect Fees**: Once a market resolves, owners can withdraw their earned fees via the dashboard.

---

## 5. Technology Stack

- **Blockchain**: Aptos (Move Language)
- **Frontend**: Next.js, React, Chakra UI, Framer Motion
- **Data Viz**: Recharts, Chart.js
- **Backend**: Node.js, Express, PostgreSQL
- **Oracle**: Pyth Network
- **Wallets**: Aptos Wallet Adapter (AIP-62)

---

## 6. Development Roadmap

- [x] **V1.0**: Core Bidding & Settlement logic.
- [x] **V1.1**: Profile & Leaderboard Redesign (High-fidelity analytics).
- [ ] **V1.2**: Social Trading (Public profiles, performance badges).
- [ ] **V2.0**: Permissionless Market Factory & Multi-token pooling.

---

*Documentation last updated: April 2026*
