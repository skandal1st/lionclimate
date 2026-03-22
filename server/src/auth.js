import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = () => process.env.JWT_SECRET || 'dev-insecure-change-me';

export function signToken() {
  return jwt.sign({ role: 'admin' }, JWT_SECRET(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch {
    return null;
  }
}

function normalizeHash(raw) {
  let h = (raw || '').trim();
  if ((h.startsWith('"') && h.endsWith('"')) || (h.startsWith("'") && h.endsWith("'"))) {
    h = h.slice(1, -1).trim();
  }
  return h;
}

export function isAdminAuthConfigured() {
  return !!(normalizeHash(process.env.ADMIN_PASSWORD_HASH) || (process.env.ADMIN_PASSWORD || '').trim());
}

export async function verifyAdminPassword(plain) {
  const pwd = typeof plain === 'string' ? plain : '';
  const hash = normalizeHash(process.env.ADMIN_PASSWORD_HASH);
  if (hash) {
    if (!hash.startsWith('$2')) {
      console.error('[auth] ADMIN_PASSWORD_HASH must be a bcrypt string starting with $2a$, $2b$ or $2y$');
      return false;
    }
    try {
      return await bcrypt.compare(pwd, hash);
    } catch (e) {
      console.error('[auth] bcrypt.compare failed — check ADMIN_PASSWORD_HASH in server/.env (one line, no extra quotes):', e.message);
      return false;
    }
  }
  const plainEnv = (process.env.ADMIN_PASSWORD || '').trim();
  if (!plainEnv) {
    return false;
  }
  const a = Buffer.from(pwd, 'utf8');
  const b = Buffer.from(plainEnv, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
