import { Router, Request, Response } from 'express';
import { pool, toHumanAmount } from '../db';

const router = Router();

// Helper to get time filter for a range
function getTimeFilter(range: string): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (range) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'alltime':
        default:
            start.setFullYear(2000, 0, 1);
            break;
    }
    return { start, end };
}

// GET /leaderboards/profit - [Task 1.4]
router.get('/profit', async (req: Request, res: Response) => {
    try {
        const { range = 'alltime', limit = '10' } = req.query;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        const { start, end } = getTimeFilter(range as string);

        const query = `
          WITH user_pnl AS (
            SELECT 
              user_addr,
              COALESCE(SUM(winning_raw::bigint), 0) - (
                SELECT COALESCE(SUM(amount_raw::bigint), 0) 
                FROM bets b2 
                WHERE b2.user_addr = c.user_addr 
                AND b2.created_at >= $1 AND b2.created_at <= $2
              ) as pnl_raw,
              COALESCE(SUM(winning_raw::bigint), 0) as total_winning_raw,
              COUNT(*) as won_count
            FROM claims c
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY user_addr
          ),
          user_volume AS (
            SELECT 
                user_addr,
                COALESCE(SUM(amount_raw::bigint), 0) as total_volume_raw,
                COUNT(*) as markets_played
            FROM bets
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY user_addr
          )
          SELECT 
            COALESCE(p.user_addr, v.user_addr) as user_addr,
            COALESCE(p.pnl_raw, 0) as pnl_raw,
            COALESCE(v.total_volume_raw, 0) as volume_raw,
            COALESCE(v.markets_played, 0) as markets_played,
            COALESCE(p.won_count, 0) as won_count
          FROM user_pnl p
          FULL OUTER JOIN user_volume v ON p.user_addr = v.user_addr
          ORDER BY pnl_raw DESC
          LIMIT $3
        `;

        const result = await pool.query(query, [start, end, parseInt(limit as string)]);
        const entries = result.rows.map((row, idx) => {
            const mPlayed = parseInt(row.markets_played);
            const won = parseInt(row.won_count);
            return {
                rank: idx + 1,
                user_addr: row.user_addr,
                pnl: { raw: row.pnl_raw, human: toHumanAmount(row.pnl_raw, decimals) },
                volume: { raw: row.volume_raw, human: toHumanAmount(row.volume_raw, decimals) },
                markets_played: mPlayed,
                win_rate: mPlayed > 0 ? parseFloat((won / mPlayed * 100).toFixed(2)) : 0
            };
        });

        res.json({ range, entries, last_updated: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching profit leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /leaderboards/volume - [Task 1.5]
router.get('/volume', async (req: Request, res: Response) => {
    try {
        const { range = 'alltime', limit = '10' } = req.query;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        const { start, end } = getTimeFilter(range as string);

        const query = `
          WITH user_volume AS (
            SELECT 
              user_addr,
              COALESCE(SUM(amount_raw::bigint), 0) as total_volume_raw,
              COUNT(*) as markets_played
            FROM bets
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY user_addr
          ),
          user_winnings AS (
            SELECT
              user_addr,
              COALESCE(SUM(winning_raw::bigint), 0) as total_winning_raw
            FROM claims
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY user_addr
          )
          SELECT 
            v.user_addr,
            v.total_volume_raw,
            v.markets_played,
            COALESCE(w.total_winning_raw, 0) - v.total_volume_raw as pnl_raw
          FROM user_volume v
          LEFT JOIN user_winnings w ON v.user_addr = w.user_addr
          ORDER BY total_volume_raw DESC
          LIMIT $3
        `;

        const result = await pool.query(query, [start, end, parseInt(limit as string)]);
        const entries = result.rows.map((row, idx) => ({
            rank: idx + 1,
            user_addr: row.user_addr,
            volume: { raw: row.total_volume_raw, human: toHumanAmount(row.total_volume_raw, decimals) },
            pnl: { raw: row.pnl_raw, human: toHumanAmount(row.pnl_raw, decimals) },
            markets_played: parseInt(row.markets_played)
        }));

        res.json({ range, entries, last_updated: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching volume leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /leaderboards/owners/participants - [Task 1.6]
router.get('/owners/participants', async (req: Request, res: Response) => {
    try {
        const { range = 'alltime', limit = '10' } = req.query;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        const { start, end } = getTimeFilter(range as string);

        // This query counts distinct bidders across all markets of an owner
        const query = `
          SELECT 
            m.owner_addr,
            COUNT(DISTINCT b.user_addr) as total_participants,
            COUNT(DISTINCT m.market_addr) as markets_created,
            COALESCE(SUM(b.amount_raw::bigint), 0) as total_pool_raw,
            COALESCE((
              SELECT SUM(fee_raw::bigint) 
              FROM owner_fees f 
              WHERE f.owner_addr = m.owner_addr 
                AND f.created_at >= $1 AND f.created_at <= $2
            ), 0) as fee_earned_raw
          FROM markets m
          LEFT JOIN bets b ON m.market_addr = b.market_addr
          WHERE m.created_at >= $1 AND m.created_at <= $2
          GROUP BY m.owner_addr
          ORDER BY total_participants DESC
          LIMIT $3
        `;

        // Note: owner_fees table might also be used, but joining markets + bets is more accurate for participant count
        const result = await pool.query(query, [start, end, parseInt(limit as string)]);
        const entries = result.rows.map((row, idx) => ({
            rank: idx + 1,
            owner_addr: row.owner_addr,
            total_participants: parseInt(row.total_participants),
            markets_created: parseInt(row.markets_created),
            total_pool: { raw: row.total_pool_raw, human: toHumanAmount(row.total_pool_raw, decimals) },
            fee_earned: { raw: row.fee_earned_raw, human: toHumanAmount(row.fee_earned_raw, decimals) }
        }));

        res.json({ range, entries, last_updated: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching owner participants leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /leaderboards/owners/pools - [Task 1.7]
router.get('/owners/pools', async (req: Request, res: Response) => {
    try {
        const { range = 'alltime', limit = '10' } = req.query;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        const { start, end } = getTimeFilter(range as string);

        const query = `
          SELECT 
            m.owner_addr,
            COALESCE(SUM(b.amount_raw::bigint), 0) as total_pool_raw,
            COUNT(DISTINCT m.market_addr) as markets_created,
            COUNT(DISTINCT b.user_addr) as total_participants,
            COALESCE((
              SELECT SUM(fee_raw::bigint) 
              FROM owner_fees f 
              WHERE f.owner_addr = m.owner_addr 
                AND f.created_at >= $1 AND f.created_at <= $2
            ), 0) as fee_earned_raw
          FROM markets m
          LEFT JOIN bets b ON m.market_addr = b.market_addr
          WHERE m.created_at >= $1 AND m.created_at <= $2
          GROUP BY m.owner_addr
          ORDER BY total_pool_raw DESC
          LIMIT $3
        `;

        const result = await pool.query(query, [start, end, parseInt(limit as string)]);
        const entries = result.rows.map((row, idx) => ({
            rank: idx + 1,
            owner_addr: row.owner_addr,
            total_pool: { raw: row.total_pool_raw, human: toHumanAmount(row.total_pool_raw, decimals) },
            markets_created: parseInt(row.markets_created),
            total_participants: parseInt(row.total_participants),
            fee_earned: { raw: row.fee_earned_raw, human: toHumanAmount(row.fee_earned_raw, decimals) }
        }));

        res.json({ range, entries, last_updated: new Date().toISOString() });
    } catch (error) {
        console.error('Error fetching owner pools leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
