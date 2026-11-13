import axios from 'axios';
import { getAptosClient } from '../config/network';
import { BINARY_OPTION_MARKET_MODULE_ADDRESS } from '../config/contracts';

// API base URL for frontend
const API_BASE_URL = '/api';

export interface ProfileStats {
  user_addr: string;
  totals: {
    bet: { raw: string; human: string };
    winning: { raw: string; human: string };
    pnl: { raw: string; human: string };
    owner_fee: { raw: string; human: string };
    lost_count: number;
    win_rate: number;
    roi: number;
  };
  counts: {
    played: number;
    created: number;
    won: number;
    lost: number;
  };
  monthly: {
    ym: string;
    bet: { raw: string; human: string };
    winning: { raw: string; human: string };
    pnl: { raw: string; human: string };
    is_profitable: boolean;
    played: number;
    won: number;
    win_rate: number;
  };
  metadata: {
    joined_at: string;
    level: number;
    rank_label: string;
    achievements: string[];
  };
}

export interface BetHistoryEntry {
  bet_id: string;
  market_addr: string;
  pair_name: string;
  side: 'Long' | 'Short';
  bet_amount: string;
  claim_amount: string;
  pnl: string;
  status: 'active' | 'won' | 'lost' | 'pending';
  bet_time: string;
  is_resolved: boolean;
  strike_price: string;
  final_price: string;
}

export const profileService = {
  getProfile: async (addr: string): Promise<ProfileStats> => {
    // Note: The frontend proxy already points to localhost:4000
    const response = await axios.get(`${API_BASE_URL}/profiles/${addr}`);
    const profile = response.data;

    try {
      const aptos = getAptosClient();
      const onchainStats = await aptos.view({
        payload: {
          function: `${BINARY_OPTION_MARKET_MODULE_ADDRESS}::binary_option_market::get_user_stats`,
          typeArguments: [],
          functionArguments: [addr],
        }
      });
      // Returns (total_volume, total_winnings, markets_played, markets_won)
      if (onchainStats && Array.isArray(onchainStats) && onchainStats.length === 4) {
        const volumeRaw = String(onchainStats[0]);
        const winningsRaw = String(onchainStats[1]);
        const played = Number(onchainStats[2]);
        const won = Number(onchainStats[3]);
        
        const decimals = 8;
        const toHuman = (raw: string) => (Number(raw) / Math.pow(10, decimals)).toFixed(6);

        if (Number(volumeRaw) > 0 || played > 0) {
            profile.totals.bet.raw = volumeRaw;
            profile.totals.bet.human = toHuman(volumeRaw);
            profile.totals.winning.raw = winningsRaw;
            profile.totals.winning.human = toHuman(winningsRaw);
            
            const pnlRaw = (BigInt(winningsRaw) - BigInt(volumeRaw)).toString();
            const pnlHuman = (parseFloat(toHuman(winningsRaw)) - parseFloat(toHuman(volumeRaw))).toFixed(6);
            profile.totals.pnl.raw = pnlRaw;
            profile.totals.pnl.human = pnlHuman;
            
            profile.counts.played = played;
            profile.counts.won = won;
            profile.totals.win_rate = played > 0 ? parseFloat((won / played * 100).toFixed(2)) : 0;
            profile.totals.roi = Number(toHuman(volumeRaw)) > 0 
                ? parseFloat(((parseFloat(pnlHuman) / Number(toHuman(volumeRaw))) * 100).toFixed(2))
                : 0;
        }
      }
    } catch (e) {
      console.error('Failed to overlay on-chain user stats:', e);
    }

    return profile;
  },

  getHistory: async (addr: string, page = 1, limit = 10, status = 'all'): Promise<{
    history: BetHistoryEntry[];
    page: number;
    limit: number;
    count: number;
  }> => {
    // We added this endpoint in the backend
    const response = await axios.get(`${API_BASE_URL}/profiles/${addr}/history`, {
        params: { page, limit, status }
    });
    return response.data;
  },

  getMonthlyStats: async (addr: string, ym: string): Promise<ProfileStats['monthly']> => {
    const response = await axios.get(`${API_BASE_URL}/profiles/${addr}/monthly`, {
        params: { ym }
    });
    return response.data;
  }
};
