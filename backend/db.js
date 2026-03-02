
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não definido. Configure no .env / Render.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gifts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      link TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL,
      gift_id TEXT NOT NULL,
      status TEXT NOT NULL,
      mp_payment_id TEXT,
      created_at BIGINT NOT NULL,
      paid_at BIGINT,
      CONSTRAINT fk_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
      CONSTRAINT fk_gift FOREIGN KEY (gift_id) REFERENCES gifts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_payments_visit_id ON payments(visit_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);
}

let inited = false;
async function ensureInit() {
  if (inited) return;
  await init();
  inited = true;
}

async function run(sql, params = []) {
  await ensureInit();
  await pool.query(sql, params);
}

async function get(sql, params = []) {
  await ensureInit();
  const { rows } = await pool.query(sql, params);
  return rows[0] ?? null;
}

async function all(sql, params = []) {
  await ensureInit();
  const { rows } = await pool.query(sql, params);
  return rows;
}

module.exports = { run, get, all, pool };
