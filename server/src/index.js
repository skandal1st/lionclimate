import './loadEnv.js';
import cors from 'cors';
import express from 'express';
import path from 'path';
import rateLimit from 'express-rate-limit';

import db, { isDatabaseWritable } from './db.js';

function serializeLead(row) {
  if (!row) return row;
  const o = { ...row };
  if (o.deal_extra == null || o.deal_extra === '') {
    o.deal_extra = {};
  } else if (typeof o.deal_extra === 'string') {
    try {
      o.deal_extra = JSON.parse(o.deal_extra);
    } catch {
      o.deal_extra = {};
    }
  }
  return o;
}
import { isAdminAuthConfigured, signToken, verifyAdminPassword } from './auth.js';
import { requireAuth } from './middleware/auth.js';
import { sendLeadToTelegram } from './telegram.js';
import {
  readProducts,
  writeProducts,
  getUploadDir,
  getUploadUrl,
} from './productsStore.js';
import { CHARACTERISTICS_SCHEMA, buildCharacteristicsFromObject } from './characteristicsSchema.js';
import multer from 'multer';
import fs from 'fs';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// За nginx приходит X-Forwarded-For — обязательно, иначе express-rate-limit v7 падает с ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
const trustHops = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? '1', 10);
app.set('trust proxy', Number.isFinite(trustHops) && trustHops >= 0 ? trustHops : 1);

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

const leadsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // Дублируем защиту: при сбое trust proxy не валить запрос ValidationError
  validate: { xForwardedForHeader: false },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Слишком много заявок с этого адреса. Попробуйте через несколько минут.',
    });
  },
});

// --- Public: submit lead ---
app.post('/api/leads', leadsLimiter, (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const service = String(body.service ?? '').trim() || null;
    const message = String(body.message ?? '').trim() || null;
    const formType = body.formType === 'consultation' ? 'consultation' : 'contact';
    const source = body.source ? String(body.source).slice(0, 500) : null;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Укажите имя и телефон' });
    }

    const createdAt = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO leads (created_at, name, phone, service, message, form_type, status, notes, source)
      VALUES (?, ?, ?, ?, ?, ?, 'new', NULL, ?)
    `);
    const info = stmt.run(createdAt, name, phone, service, message, formType, source);
    const id = info.lastInsertRowid;

    setImmediate(() => {
      sendLeadToTelegram(
        { name, phone, service: service || 'Не указано', message: message || 'Не указано', formType },
        process.env
      ).catch((e) => console.error('[telegram]', e));
    });

    return res.json({ success: true, id });
  } catch (e) {
    console.error('[api/leads]', e);
    const readonly =
      (e && typeof e === 'object' && 'code' in e && e.code === 'SQLITE_READONLY') ||
      /readonly/i.test(String(e && e.message));
    return res.status(500).json({
      success: false,
      error: readonly
        ? 'База данных на сервере только для чтения. Нужны права на каталог data/ (см. NODE_DEPLOY.md).'
        : 'Не удалось сохранить заявку. Попробуйте позже или позвоните.',
    });
  }
});

// --- Auth ---
app.post('/api/auth/login', async (req, res) => {
  const password = req.body?.password ?? '';
  if (!isAdminAuthConfigured()) {
    console.error('[auth] No ADMIN_PASSWORD_HASH or ADMIN_PASSWORD in server/.env');
    return res.status(503).json({ error: 'Server misconfigured: admin password not set' });
  }
  const ok = await verifyAdminPassword(password);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = signToken();
  res.json({ token });
});

app.get('/api/admin/me', requireAuth, (req, res) => {
  res.json({ ok: true, role: 'admin' });
});

// --- Admin leads ---
app.get('/api/admin/leads', requireAuth, (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;
  const formType = req.query.formType ? String(req.query.formType) : null;
  const from = req.query.from ? String(req.query.from) : null;
  const to = req.query.to ? String(req.query.to) : null;

  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (formType) {
    sql += ' AND form_type = ?';
    params.push(formType);
  }
  if (from) {
    sql += ' AND created_at >= ?';
    params.push(from);
  }
  if (to) {
    sql += ' AND created_at <= ?';
    params.push(to);
  }
  sql += ' ORDER BY datetime(created_at) DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(serializeLead));
});

app.get('/api/admin/leads/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(serializeLead(row));
});

app.patch('/api/admin/leads/:id', requireAuth, (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Not found' });
  }
  const body = req.body || {};
  const allowed = ['status', 'notes', 'deal_address', 'deal_ac_model', 'deal_extra'];
  const updates = [];
  const vals = [];
  for (const key of allowed) {
    if (!(key in body)) continue;
    updates.push(`${key} = ?`);
    if (key === 'deal_extra') {
      const v = body.deal_extra;
      if (v == null) vals.push(null);
      else if (typeof v === 'object') vals.push(JSON.stringify(v));
      else vals.push(String(v));
    } else {
      vals.push(body[key] == null ? null : String(body[key]));
    }
  }
  if (updates.length === 0) {
    return res.json(serializeLead(existing));
  }
  vals.push(id);
  db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  res.json(serializeLead(row));
});

app.get('/api/admin/crm-fields', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, field_key, label, sort_order FROM crm_custom_fields ORDER BY sort_order ASC, id ASC')
    .all();
  res.json(rows);
});

app.put('/api/admin/crm-fields', requireAuth, (req, res) => {
  const fields = req.body?.fields;
  if (!Array.isArray(fields)) {
    return res.status(400).json({ error: 'fields must be an array' });
  }
  if (fields.length > 40) {
    return res.status(400).json({ error: 'Too many fields' });
  }
  const keyRe = /^[a-zA-Z0-9_]{1,64}$/;
  const normalized = [];
  const seen = new Set();
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const fieldKey = String(f.field_key || '').trim();
    const label = String(f.label || '').trim();
    if (!keyRe.test(fieldKey) || !label) {
      return res.status(400).json({ error: 'Invalid field_key or label' });
    }
    if (seen.has(fieldKey)) {
      return res.status(400).json({ error: 'Duplicate field_key' });
    }
    seen.add(fieldKey);
    normalized.push({ fieldKey, label, order: i });
  }
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM crm_custom_fields').run();
    const ins = db.prepare('INSERT INTO crm_custom_fields (field_key, label, sort_order) VALUES (?, ?, ?)');
    for (const n of normalized) {
      ins.run(n.fieldKey, n.label, n.order);
    }
  });
  tx();
  const rows = db
    .prepare('SELECT id, field_key, label, sort_order FROM crm_custom_fields ORDER BY sort_order ASC, id ASC')
    .all();
  res.json(rows);
});

// --- Public products (same behaviour as PHP api) ---
app.get('/api/products', (req, res) => {
  const products = readProducts();
  const active = products.filter((p) => !('is_active' in p) || p.is_active);
  active.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
  res.json(active);
});

app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const p = products.find((x) => x.id === req.params.id);
  if (!p) {
    return res.status(404).json({ error: 'not found' });
  }
  if (p.is_active === false) {
    return res.status(404).json({ error: 'not found' });
  }
  res.json(p);
});

// --- Admin products ---
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = getUploadDir();
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const safe = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
      cb(null, `product_${Date.now()}_${Math.random().toString(36).slice(2)}${safe}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

app.get('/api/admin/products', requireAuth, (req, res) => {
  res.json(readProducts());
});

app.get('/api/admin/schema/characteristics', requireAuth, (req, res) => {
  res.json(CHARACTERISTICS_SCHEMA);
});

app.get('/api/admin/products/:id', requireAuth, (req, res) => {
  const products = readProducts();
  const p = products.find((x) => x.id === req.params.id);
  if (!p) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(p);
});

function parseProductBody(req) {
  const b = req.body;
  if (typeof b.data === 'string') {
    try {
      return JSON.parse(b.data);
    } catch {
      return null;
    }
  }
  return b.product ? (typeof b.product === 'string' ? JSON.parse(b.product) : b.product) : b;
}

app.post('/api/admin/products', requireAuth, upload.single('image'), (req, res) => {
  let data = parseProductBody(req);
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const name = String(data.name ?? '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const products = readProducts();
  const id = data.id && String(data.id).trim() ? String(data.id).trim() : `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const imageUrl = String(data.image_url ?? '').trim();
  let imagePath = '';

  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    imagePath = imageUrl;
  } else if (req.file) {
    imagePath = getUploadUrl() + req.file.filename;
  }

  const characteristics = Array.isArray(data.characteristics)
    ? data.characteristics
    : buildCharacteristicsFromObject(data.characteristics || data.chars || {});

  const product = {
    id,
    name,
    brand: String(data.brand ?? '').trim(),
    model: String(data.model ?? '').trim(),
    price: data.price !== '' && data.price != null ? Number(data.price) : null,
    description: String(data.description ?? '').trim(),
    characteristics,
    is_active: data.is_active !== false && data.is_active !== '0' && data.is_active !== 0,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  const su = String(data.supplier_url ?? '').trim();
  if (su && /^https?:\/\//i.test(su)) {
    product.supplier_url = su;
  }

  if (imagePath) {
    product.image = imagePath;
  }

  products.push(product);
  writeProducts(products);
  res.status(201).json(product);
});

app.put('/api/admin/products/:id', requireAuth, upload.single('image'), (req, res) => {
  const products = readProducts();
  const idx = products.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' });
  }

  let data = parseProductBody(req);
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const prev = products[idx];
  const name = String(data.name ?? prev.name).trim();
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const imageUrl = String(data.image_url ?? '').trim();
  let imagePath = prev.image || '';

  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    imagePath = imageUrl;
  } else if (req.file) {
    imagePath = getUploadUrl() + req.file.filename;
  }

  const characteristics = Array.isArray(data.characteristics)
    ? data.characteristics
    : buildCharacteristicsFromObject(data.characteristics || data.chars || {});

  const product = {
    ...prev,
    name,
    brand: String(data.brand ?? prev.brand ?? '').trim(),
    model: String(data.model ?? prev.model ?? '').trim(),
    price: data.price !== '' && data.price != null ? Number(data.price) : null,
    description: String(data.description ?? prev.description ?? '').trim(),
    characteristics,
    is_active: data.is_active !== false && data.is_active !== '0' && data.is_active !== 0,
  };

  const su = String(data.supplier_url ?? prev.supplier_url ?? '').trim();
  if (su && /^https?:\/\//i.test(su)) {
    product.supplier_url = su;
  } else if (!su) {
    delete product.supplier_url;
  }

  if (imagePath) {
    product.image = imagePath;
  }

  products[idx] = product;
  writeProducts(products);
  res.json(product);
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  const products = readProducts();
  const next = products.filter((x) => x.id !== req.params.id);
  if (next.length === products.length) {
    return res.status(404).json({ error: 'Not found' });
  }
  writeProducts(next);
  res.json({ ok: true });
});

// JSON-only create/update for SPA without multipart
app.post('/api/admin/products/json', requireAuth, (req, res) => {
  const data = req.body;
  const name = String(data.name ?? '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const products = readProducts();
  const id = data.id && String(data.id).trim() ? String(data.id).trim() : `prod_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  let imagePath = '';
  const imageUrl = String(data.image_url ?? '').trim();
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    imagePath = imageUrl;
  } else if (String(data.image ?? '').trim()) {
    imagePath = String(data.image).trim();
  }

  const characteristics = Array.isArray(data.characteristics)
    ? data.characteristics
    : buildCharacteristicsFromObject(data.characteristics || data.chars || {});

  const product = {
    id,
    name,
    brand: String(data.brand ?? '').trim(),
    model: String(data.model ?? '').trim(),
    price: data.price !== '' && data.price != null ? Number(data.price) : null,
    description: String(data.description ?? '').trim(),
    characteristics,
    is_active: data.is_active !== false,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  const su = String(data.supplier_url ?? '').trim();
  if (su && /^https?:\/\//i.test(su)) {
    product.supplier_url = su;
  }
  if (imagePath) {
    product.image = imagePath;
  }

  products.push(product);
  writeProducts(products);
  res.status(201).json(product);
});

app.put('/api/admin/products/json/:id', requireAuth, (req, res) => {
  const products = readProducts();
  const idx = products.findIndex((x) => x.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Not found' });
  }
  const data = req.body;
  const prev = products[idx];
  const name = String(data.name ?? prev.name).trim();
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  let imagePath = prev.image || '';
  const imageUrl = String(data.image_url ?? '').trim();
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    imagePath = imageUrl;
  } else if (data.image != null && String(data.image).trim() !== '') {
    imagePath = String(data.image).trim();
  }

  const characteristics = Array.isArray(data.characteristics)
    ? data.characteristics
    : buildCharacteristicsFromObject(data.characteristics || data.chars || {});

  const product = {
    ...prev,
    name,
    brand: String(data.brand ?? prev.brand ?? '').trim(),
    model: String(data.model ?? prev.model ?? '').trim(),
    price: data.price !== '' && data.price != null ? Number(data.price) : null,
    description: String(data.description ?? prev.description ?? '').trim(),
    characteristics,
    is_active: data.is_active !== false && data.is_active !== '0',
  };

  const su = String(data.supplier_url ?? prev.supplier_url ?? '').trim();
  if (su && /^https?:\/\//i.test(su)) {
    product.supplier_url = su;
  } else if (!su) {
    delete product.supplier_url;
  }

  if (imagePath) {
    product.image = imagePath;
  }

  products[idx] = product;
  writeProducts(products);
  res.json(product);
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    adminAuthConfigured: isAdminAuthConfigured(),
    dbWritable: isDatabaseWritable(),
  });
});

app.use((err, req, res, next) => {
  if (req.originalUrl?.startsWith('/api')) {
    console.error('[api]', err);
    if (res.headersSent) {
      next(err);
      return;
    }
    const readonly =
      err && typeof err === 'object' && 'code' in err && err.code === 'SQLITE_READONLY';
    return res.status(500).json({
      success: false,
      error: readonly
        ? 'База данных только для чтения. Выполните: sudo chown -R www-data:www-data server/data'
        : 'Внутренняя ошибка сервера',
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`lionclimate-api listening on ${PORT}`);
  if (!isAdminAuthConfigured()) {
    console.warn('[lionclimate-api] WARNING: set ADMIN_PASSWORD_HASH or ADMIN_PASSWORD in server/.env');
  } else if (
    process.env.ADMIN_PASSWORD_HASH &&
    String(process.env.ADMIN_PASSWORD_HASH).includes('replace')
  ) {
    console.warn(
      '[lionclimate-api] ADMIN_PASSWORD_HASH still looks like a placeholder from .env.example — generate a real hash.'
    );
  }
});
