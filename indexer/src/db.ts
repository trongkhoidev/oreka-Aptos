import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.PG_URI,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
