import { Router, Request, Response } from 'express';
import { pool, toHumanAmount, getMonthBoundaries } from '../db';

const router = Router();

// GET /profiles/:addr - Get detailed profile with enhanced P&L stats
router.get('/:addr', async (req: Request, res: Response) => {
    try {
        const { addr } = req.params;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        
        // Define current month for monthly stats
        const now = new Date();
        const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { start, end } = getMonthBoundaries(currentYM);

        // Queries for Profile Totals
        const betQuery = `
          SELECT 
            COALESCE(SUM(amount_raw::bigint), 0) as total_bet_raw,
            COUNT(*) as played_count
          FROM bets 
          WHERE user_addr = $1
        `;

        const winningQuery = `
          SELECT 
            COALESCE(SUM(winning_raw::bigint), 0) as total_winning_raw,
            COUNT(*) as won_count
          FROM claims 
          WHERE user_addr = $1
        `;

        const ownerFeeQuery = `
          SELECT 
            COALESCE(SUM(fee_raw::bigint), 0) as total_owner_fee_raw,
            COUNT(DISTINCT market_addr) as created_count
          FROM owner_fees 
          WHERE owner_addr = $1
        `;

        // Lost count: Resolved markets the user bet on where they didn't win
        // This requires a join with markets table to see if resolved
        const lostQuery = `
          SELECT COUNT(*) as lost_count
          FROM bets b
          JOIN markets m ON b.market_addr = m.market_addr
          WHERE b.user_addr = $1 
            AND m.maturity_time < EXTRACT(EPOCH FROM NOW())
            AND NOT EXISTS (
              SELECT 1 FROM claims c 
              WHERE c.user_addr = b.user_addr 
                AND c.market_addr = b.market_addr
            )
        `;

        // Query for Joined Date
        const joinedQuery = `
          SELECT MIN(created_at) as joined_at
          FROM (
            SELECT MIN(created_at) as created_at FROM bets WHERE user_addr = $1
            UNION ALL
            SELECT MIN(created_at) as created_at FROM markets WHERE owner_addr = $1
          ) joined_dates
        `;

        // Monthly stats query
        const monthlyQuery = `
          WITH monthly_bets AS (
            SELECT 
              COALESCE(SUM(amount_raw::bigint), 0) as bet_raw,
              COUNT(*) as played
            FROM bets 
            WHERE user_addr = $1 AND created_at >= $2 AND created_at < $3
          ),
          monthly_winnings AS (
            SELECT 
              COALESCE(SUM(winning_raw::bigint), 0) as winning_raw,
              COUNT(*) as won
            FROM claims 
            WHERE user_addr = $1 AND created_at >= $2 AND created_at < $3
          )
          SELECT 
            b.bet_raw, b.played, w.winning_raw, w.won
          FROM monthly_bets b, monthly_winnings w
        `;

        const [
            betResult, 
            winningResult, 
            ownerFeeResult, 
            lostResult,
            monthlyResult,
            joinedResult
        ] = await Promise.all([
            pool.query(betQuery, [addr.toLowerCase()]),
            pool.query(winningQuery, [addr.toLowerCase()]),
            pool.query(ownerFeeQuery, [addr.toLowerCase()]),
            pool.query(lostQuery, [addr.toLowerCase()]),
            pool.query(monthlyQuery, [addr.toLowerCase(), start, end]),
            pool.query(joinedQuery, [addr.toLowerCase()])
        ]);

        const joinedAt = joinedResult.rows[0]?.joined_at || new Date().toISOString();
        const totalBetRaw = betResult.rows[0]?.total_bet_raw || '0';
        const totalWinningRaw = winningResult.rows[0]?.total_winning_raw || '0';
        const totalOwnerFeeRaw = ownerFeeResult.rows[0]?.total_owner_fee_raw || '0';
        const lostCount = parseInt(lostResult.rows[0]?.lost_count || '0');

        const playedCount = parseInt(betResult.rows[0]?.played_count || '0');
        const wonCount = parseInt(winningResult.rows[0]?.won_count || '0');
        
        // P&L Calculations
        const pnlRaw = (BigInt(totalWinningRaw) - BigInt(totalBetRaw)).toString();
        const pnlHuman = (parseFloat(toHumanAmount(totalWinningRaw, decimals)) - parseFloat(toHumanAmount(totalBetRaw, decimals))).toFixed(6);
        const winRate = playedCount > 0 ? (wonCount / playedCount * 100).toFixed(2) : '0.00';
        const roi = parseFloat(toHumanAmount(totalBetRaw, decimals)) > 0 
            ? (parseFloat(pnlHuman) / parseFloat(toHumanAmount(totalBetRaw, decimals)) * 100).toFixed(2) 
            : '0.00';

        // Monthly processing
        const mRow = monthlyResult.rows[0];
        const mBetRaw = mRow?.bet_raw || '0';
        const mWinningRaw = mRow?.winning_raw || '0';
        const mPlayed = parseInt(mRow?.played || '0');
        const mWon = parseInt(mRow?.won || '0');
        const mPnlRaw = (BigInt(mWinningRaw) - BigInt(mBetRaw)).toString();
        const mPnlHuman = (parseFloat(toHumanAmount(mWinningRaw, decimals)) - parseFloat(toHumanAmount(mBetRaw, decimals))).toFixed(6);

        // Level calculation logic
        let level = 1;
        if (playedCount > 100) level = 4;
        else if (playedCount > 50) level = 3;
        else if (playedCount > 10) level = 2;

        const response = {
            user_addr: addr,
            metadata: {
                joined_at: joinedAt,
                level: level,
                rank_label: playedCount > 0 ? (parseFloat(winRate) > 60 ? "Top 5% Trader" : "Top 25% Trader") : "New Trader",
                achievements: [
                    ...(playedCount > 0 ? ["Active Trader"] : []),
                    ...(wonCount > 10 ? ["Profit Master"] : []),
                    ...(parseInt(ownerFeeResult.rows[0]?.created_count || '0') > 0 ? ["Market Creator"] : [])
                ]
            },
            totals: {
                bet: {
                    raw: totalBetRaw,
                    human: toHumanAmount(totalBetRaw, decimals)
                },
                winning: {
                    raw: totalWinningRaw,
                    human: toHumanAmount(totalWinningRaw, decimals)
                },
                pnl: {
                    raw: pnlRaw,
                    human: pnlHuman
                },
                owner_fee: {
                    raw: totalOwnerFeeRaw,
                    human: toHumanAmount(totalOwnerFeeRaw, decimals)
                },
                lost_count: lostCount,
                win_rate: parseFloat(winRate),
                roi: parseFloat(roi)
            },
            counts: {
                played: playedCount,
                created: parseInt(ownerFeeResult.rows[0]?.created_count || '0'),
                won: wonCount,
                lost: lostCount
            },
            monthly: {
                ym: currentYM,
                bet: { raw: mBetRaw, human: toHumanAmount(mBetRaw, decimals) },
                winning: { raw: mWinningRaw, human: toHumanAmount(mWinningRaw, decimals) },
                pnl: { raw: mPnlRaw, human: mPnlHuman },
                is_profitable: BigInt(mWinningRaw) > BigInt(mBetRaw),
                played: mPlayed,
                won: mWon,
                win_rate: mPlayed > 0 ? parseFloat((mWon / mPlayed * 100).toFixed(2)) : 0
            }
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /profiles/:addr/history - [Task 1.2] Implementation
router.get('/:addr/history', async (req: Request, res: Response) => {
    try {
        const { addr } = req.params;
        const { page = '1', limit = '10', status = 'all' } = req.query;
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        // This query joins bets, markets, and claims to get a full view
        let query = `
          SELECT 
            b.id as bet_id,
            b.market_addr as market_addr,
            b.amount_raw as amount_raw,
            b.side,
            b.created_at as bet_time,
            m.trading_pair as pair_name,
            m.strike_price,
            m.final_price,
            (m.is_resolved OR m.maturity_time < EXTRACT(EPOCH FROM NOW())) as is_resolved,
            m.resolution_outcome as result,
            c.winning_raw as claim_amount_raw,
            c.created_at as claim_time
          FROM bets b
          JOIN markets m ON b.market_addr = m.market_addr
          LEFT JOIN claims c ON b.user_addr = c.user_addr AND b.market_addr = c.market_addr
          WHERE b.user_addr = $1
        `;

        const queryParams: any[] = [addr.toLowerCase()];

        if (status === 'active') {
            query += ` AND m.maturity_time >= EXTRACT(EPOCH FROM NOW())`;
        } else if (status === 'won') {
            query += ` AND c.winning_raw::bigint > 0`;
        } else if (status === 'lost') {
            query += ` AND m.maturity_time < EXTRACT(EPOCH FROM NOW()) AND c.id IS NULL`;
        } else if (status === 'pending') {
            query += ` AND m.maturity_time < EXTRACT(EPOCH FROM NOW()) AND c.id IS NULL`; // Same as lost for now unless partial payout
        }

        query += ` ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`;
        queryParams.push(parseInt(limit as string), offset);

        const result = await pool.query(query, queryParams);
        
        const history = result.rows.map(row => {
            const betAmount = parseFloat(toHumanAmount(row.amount_raw, decimals));
            const claimAmount = row.claim_amount_raw ? parseFloat(toHumanAmount(row.claim_amount_raw, decimals)) : 0;
            const pnl = row.is_resolved ? (claimAmount - betAmount) : 0;
            
            let betStatus = 'active';
            if (row.is_resolved) {
                betStatus = claimAmount > 0 ? 'won' : 'lost';
            }

            return {
                bet_id: row.bet_id,
                market_addr: row.market_addr,
                pair_name: row.pair_name,
                side: row.side === 0 ? 'Long' : 'Short',
                bet_amount: betAmount.toFixed(4),
                claim_amount: claimAmount.toFixed(4),
                pnl: pnl.toFixed(4),
                status: betStatus,
                bet_time: row.bet_time,
                is_resolved: row.is_resolved !== null,
                strike_price: row.strike_price,
                final_price: row.final_price
            };
        });

        res.json({
            history,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            count: history.length
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /profiles/:addr/monthly - [Task 1.3] Implementation
router.get('/:addr/monthly', async (req: Request, res: Response) => {
    try {
        const { addr } = req.params;
        const { ym } = req.query; // YYYY-MM
        const decimals = parseInt(process.env.TOKEN_DECIMALS || '8');
        
        if (!ym || typeof ym !== 'string') {
            return res.status(400).json({ error: 'ym (YYYY-MM) query param is required' });
        }

        const { start, end } = getMonthBoundaries(ym);

        const monthlyQuery = `
          WITH monthly_bets AS (
            SELECT 
              COALESCE(SUM(amount_raw::bigint), 0) as bet_raw,
              COUNT(*) as played
            FROM bets 
            WHERE user_addr = $1 AND created_at >= $2 AND created_at < $3
          ),
          monthly_winnings AS (
            SELECT 
              COALESCE(SUM(winning_raw::bigint), 0) as winning_raw,
              COUNT(*) as won
            FROM claims 
            WHERE user_addr = $1 AND created_at >= $2 AND created_at < $3
          )
          SELECT 
            b.bet_raw, b.played, w.winning_raw, w.won
          FROM monthly_bets b, monthly_winnings w
        `;

        const result = await pool.query(monthlyQuery, [addr.toLowerCase(), start, end]);
        const mRow = result.rows[0];

        const mBetRaw = mRow?.bet_raw || '0';
        const mWinningRaw = mRow?.winning_raw || '0';
        const mPlayed = parseInt(mRow?.played || '0');
        const mWon = parseInt(mRow?.won || '0');
        const mPnlRaw = (BigInt(mWinningRaw) - BigInt(mBetRaw)).toString();
        const mPnlHuman = (parseFloat(toHumanAmount(mWinningRaw, decimals)) - parseFloat(toHumanAmount(mBetRaw, decimals))).toFixed(6);

        res.json({
            ym,
            bet: { raw: mBetRaw, human: toHumanAmount(mBetRaw, decimals) },
            winning: { raw: mWinningRaw, human: toHumanAmount(mWinningRaw, decimals) },
            pnl: { raw: mPnlRaw, human: mPnlHuman },
            is_profitable: BigInt(mWinningRaw) > BigInt(mBetRaw),
            played: mPlayed,
            won: mWon,
            win_rate: mPlayed > 0 ? parseFloat((mWon / mPlayed * 100).toFixed(2)) : 0
        });
    } catch (error) {
        console.error('Error fetching monthly stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
