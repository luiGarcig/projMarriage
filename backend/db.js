
const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const DB_PATH = path.join(__dirname, "database.sqlite");


let SQL;
let db;

async function getDb() {
  if (db) return db;

  SQL = SQL || (await initSqlJs()); // carrega wasm

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // cria as tabelas (se não existirem)
  db.run(`
    CREATE TABLE IF NOT EXISTS gifts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      link TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL,
      gift_id TEXT NOT NULL,
      status TEXT NOT NULL,
      mp_payment_id TEXT,
      created_at INTEGER NOT NULL,
      paid_at INTEGER,
      FOREIGN KEY (visit_id) REFERENCES visits(id),
      FOREIGN KEY (gift_id) REFERENCES gifts(id)
    );

    CREATE INDEX IF NOT EXISTS idx_payments_visit_id ON payments(visit_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  `);

  // salva imediatamente após criar
  persist();

  return db;
}

function persist() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// helpers simples
async function run(sql, params = []) {
  const database = await getDb();
  database.run(sql, params);
  persist();
}

async function get(sql, params = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

async function all(sql, params = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

module.exports = { run, get, all };

