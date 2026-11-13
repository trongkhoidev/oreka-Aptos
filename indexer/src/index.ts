import { AptosClient, Types } from 'aptos';
import pool from './db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const NODE_URL = process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1';
const MODULE_ADDR = process.env.MODULE_ADDR || '';
const MODULE_NAME = process.env.MODULE_NAME || 'binary_option_market';

const client = new AptosClient(NODE_URL);

interface LastProcessed {
  event_type: string;
  last_sequence_number: string;
}

async function getLastProcessed(eventType: string): Promise<string> {
  const res = await pool.query('SELECT last_sequence_number FROM indexer_status WHERE event_type = $1', [eventType]);
  if (res.rows.length > 0) {
    return res.rows[0].last_sequence_number;
  }
  return '-1';
}

async function updateLastProcessed(eventType: string, sequenceNumber: string) {
  await pool.query(
    'INSERT INTO indexer_status (event_type, last_sequence_number) VALUES ($1, $2) ON CONFLICT (event_type) DO UPDATE SET last_sequence_number = $2',
    [eventType, sequenceNumber]
  );
}

async function handleMarketCreated(event: any) {
  const { creator, market_address, strike_price, maturity_time, price_feed_id, bidding_start_time } = event.data;
  console.log(`[MarketCreated] ${market_address} by ${creator}`);
  
  await pool.query(
    `INSERT INTO markets (market_addr, owner_addr, strike_price, maturity_time, created_timestamp, is_resolved) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     ON CONFLICT (market_addr) DO NOTHING`,
    [market_address, creator, strike_price, maturity_time, Math.floor(Date.now() / 1000), false]
  );
}

async function handleBid(event: any) {
  const { user, market_address, amount, prediction, timestamp_bid } = event.data;
  console.log(`[Bid] ${user} on ${market_address}: ${amount}`);
  
  await pool.query(
    `INSERT INTO bets (user_addr, market_addr, amount_raw, side, timestamp) 
     VALUES ($1, $2, $3, $4, $5)`,
    [user, market_address, amount, prediction ? 0 : 1, timestamp_bid]
  );
}

async function handleResolve(event: any) {
  const { market_address, final_price, result } = event.data;
  console.log(`[Resolve] ${market_address}: ${final_price}, Result: ${result}`);
  
  await pool.query(
    `UPDATE markets SET final_price = $1, resolution_outcome = $2, is_resolved = $3 WHERE market_addr = $4`,
    [final_price, result, true, market_address]
  );
}

async function handleClaim(event: any) {
  const { user, market_address, amount, won, timestamp } = event.data;
  console.log(`[Claim] ${user} on ${market_address}: ${amount} (won: ${won})`);
  
  await pool.query(
    `INSERT INTO claims (user_addr, market_addr, winning_raw, timestamp) 
     VALUES ($1, $2, $3, $4)`,
    [user, market_address, amount, timestamp || Math.floor(Date.now() / 1000)]
  );
}

async function handleWithdrawFee(event: any) {
    const { owner, market_address, amount, timestamp } = event.data;
    console.log(`[WithdrawFee] ${owner} from ${market_address}: ${amount}`);
    
    await pool.query(
        `INSERT INTO owner_fees (owner_addr, market_addr, fee_raw, timestamp) 
         VALUES ($1, $2, $3, $4)`,
        [owner, market_address, amount, timestamp || Math.floor(Date.now() / 1000)]
    );
}

const EVENT_HANDLERS: Record<string, (event: any) => Promise<void>> = {
  [`${MODULE_ADDR}::${MODULE_NAME}::MarketCreatedEvent`]: handleMarketCreated,
  [`${MODULE_ADDR}::${MODULE_NAME}::BidEvent`]: handleBid,
  [`${MODULE_ADDR}::${MODULE_NAME}::ResolveEvent`]: handleResolve,
  [`${MODULE_ADDR}::${MODULE_NAME}::ClaimEvent`]: handleClaim,
  [`${MODULE_ADDR}::${MODULE_NAME}::WithdrawFeeEvent`]: handleWithdrawFee,
};

async function pollEvents() {
  console.log('Starting event poll...');
  
  // Need to find the event handle for the MarketRegistry
  // For simplicity since it's a singleton in this design:
  const accountEvents = await client.getEventsByEventHandle(
    MODULE_ADDR,
    `${MODULE_ADDR}::${MODULE_NAME}::MarketRegistry`,
    'market_created_events'
  );
  // This is complex for multiple event handles. 
  // A better way is to use the transaction list or indexer API.
  // Since we have a local database, let's try a simpler approach if the indexer API is available.
}

// Actually, let's use a more robust polling loop that checks transaction history for the module address
async function run() {
  // Ensure status table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indexer_status (
      event_type VARCHAR(255) PRIMARY KEY,
      last_sequence_number BIGINT NOT NULL DEFAULT -1
    )
  `);

  console.log('Indexer started...');
  
  while (true) {
    try {
        // For a hackathon-style indexer, we can just fetch all events for the account
        // and filter by type.
        // In Aptos v1 SDK: client.getEventsByEventHandle(...)
        
        // Let's implement handles for each
        const eventTypes = [
            'market_created_events',
            'bid_events',
            'resolve_events',
            'claim_events',
            'withdraw_fee_events'
        ];

        for (const handleName of eventTypes) {
            const lastSeq = await getLastProcessed(handleName);
            const events = await client.getEventsByEventHandle(
                MODULE_ADDR,
                `${MODULE_ADDR}::${MODULE_NAME}::MarketRegistry`,
                handleName,
                { start: BigInt(lastSeq) + 1n, limit: 100 }
            );

            for (const event of events) {
                const typeName = event.type;
                if (handleName === 'market_created_events') await handleMarketCreated(event);
                if (handleName === 'bid_events') await handleBid(event);
                if (handleName === 'resolve_events') await handleResolve(event);
                if (handleName === 'claim_events') await handleClaim(event);
                
                await updateLastProcessed(handleName, event.sequence_number);
            }
        }

    } catch (e) {
      console.error('Error in indexer loop:', e);
    }
    
    await new Promise(resolve => setTimeout(resolve, parseInt(process.env.POLL_INTERVAL_MS || '3000')));
  }
}

run().catch(console.error);
