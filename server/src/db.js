import './loadEnv.js';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH
  ? path.isAbsolute(process.env.DATABASE_PATH)
    ? process.env.DATABASE_PATH
    : path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(__dirname, '../data/lionclimate.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT,
    message TEXT,
    form_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT,
    source TEXT
  );
`);

export default db;
