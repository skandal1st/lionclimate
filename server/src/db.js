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

export function getDbPath() {
  return dbPath;
}

/** Проверка прав на каталог и файл БД (процесс systemd обычно www-data). */
export function isDatabaseWritable() {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    if (fs.existsSync(dbPath)) {
      fs.accessSync(dbPath, fs.constants.W_OK);
    }
    return true;
  } catch {
    return false;
  }
}

if (!isDatabaseWritable()) {
  console.warn(
    `[lionclimate-db] Нет прав на запись в ${dbPath}. Исправление: sudo chown -R www-data:www-data ${dir} && sudo systemctl restart lionclimate-api`
  );
}

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

const leadColNames = new Set(db.prepare('PRAGMA table_info(leads)').all().map((c) => c.name));
function addLeadColumn(name, sqlType) {
  if (!leadColNames.has(name)) {
    db.exec(`ALTER TABLE leads ADD COLUMN ${name} ${sqlType}`);
    leadColNames.add(name);
  }
}
addLeadColumn('deal_address', 'TEXT');
addLeadColumn('deal_ac_model', 'TEXT');
addLeadColumn('deal_extra', 'TEXT');

db.exec(`
  CREATE TABLE IF NOT EXISTS crm_custom_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

export default db;
