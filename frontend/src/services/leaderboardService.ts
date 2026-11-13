import axios from 'axios';
import { getAptosClient } from '../config/network';
import { BINARY_OPTION_MARKET_MODULE_ADDRESS } from '../config/contracts';

const API_BASE_URL = '/api';

export interface LeaderboardEntry {
  rank: number;
  user_addr?: string;
  owner_addr?: string;
  pnl?: { raw: string; human: string };
  volume?: { raw: string; human: string };
  total_pool?: { raw: string; human: string };
  markets_played?: number;
  total_participants?: number;
  markets_created?: number;
  win_rate?: string | number;
  fee_earned?: { raw: string; human: string };
}

export interface LeaderboardResponse {
  range: string;
  entries: LeaderboardEntry[];
  last_updated: string;
}

const overlayOnChainStats = async (entries: LeaderboardEntry[], sortBy: 'pnl' | 'volume') => {
  const aptos = getAptosClient();
  const decimals = 8;
  const toHuman = (raw: string) => (Number(raw) / Math.pow(10, decimals)).toFixed(6);

  await Promise.all(entries.map(async (entry) => {
    if (!entry.user_addr) return;
    try {
      const onchainStats = await aptos.view({
        payload: {
          function: `${BINARY_OPTION_MARKET_MODULE_ADDRESS}::binary_option_market::get_user_stats`,
          typeArguments: [],
          functionArguments: [entry.user_addr],
        }
      });
      if (onchainStats && Array.isArray(onchainStats) && onchainStats.length === 4) {
        const volumeRaw = String(onchainStats[0]);
        const winningsRaw = String(onchainStats[1]);
        const played = Number(onchainStats[2]);
        const won = Number(onchainStats[3]);

        if (Number(volumeRaw) > 0 || played > 0) {
          entry.volume = { raw: volumeRaw, human: toHuman(volumeRaw) };
          const pnlRaw = (BigInt(winningsRaw) - BigInt(volumeRaw)).toString();
          const pnlHuman = (parseFloat(toHuman(winningsRaw)) - parseFloat(toHuman(volumeRaw))).toFixed(6);
          entry.pnl = { raw: pnlRaw, human: pnlHuman };
          entry.markets_played = played;
          entry.win_rate = played > 0 ? parseFloat((won / played * 100).toFixed(2)) : 0;
        }
      }
    } catch (e) {
      console.error(`Failed to overlay on-chain stats for ${entry.user_addr}:`, e);
    }
  }));

  if (sortBy === 'pnl') {
    entries.sort((a, b) => Number(BigInt(b.pnl?.raw || 0) - BigInt(a.pnl?.raw || 0)));
  } else if (sortBy === 'volume') {
    entries.sort((a, b) => Number(BigInt(b.volume?.raw || 0) - BigInt(a.volume?.raw || 0)));
  }

  // Update ranks
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });
};

export const leaderboardService = {
  getProfitable: async (range = 'alltime', limit = 10): Promise<LeaderboardResponse> => {
    const response = await axios.get(`${API_BASE_URL}/leaderboards/profit`, {
        params: { range, limit }
    });
    if (response.data && response.data.entries) {
        await overlayOnChainStats(response.data.entries, 'pnl');
    }
    return response.data;
  },

  getVolume: async (range = 'alltime', limit = 10): Promise<LeaderboardResponse> => {
    const response = await axios.get(`${API_BASE_URL}/leaderboards/volume`, {
        params: { range, limit }
    });
    if (response.data && response.data.entries) {
        await overlayOnChainStats(response.data.entries, 'volume');
    }
    return response.data;
  },

  getOwnerParticipants: async (range = 'alltime', limit = 10): Promise<LeaderboardResponse> => {
    const response = await axios.get(`${API_BASE_URL}/leaderboards/owners/participants`, {
        params: { range, limit }
    });
    return response.data;
  },

  getOwnerPools: async (range = 'alltime', limit = 10): Promise<LeaderboardResponse> => {
    const response = await axios.get(`${API_BASE_URL}/leaderboards/owners/pools`, {
        params: { range, limit }
    });
    return response.data;
  }
};
