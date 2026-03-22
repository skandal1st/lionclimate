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

export async function verifyAdminPassword(plain) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (hash) {
    return bcrypt.compare(plain, hash);
  }
  const plainEnv = process.env.ADMIN_PASSWORD;
  if (!plainEnv) {
    return false;
  }
  const a = Buffer.from(plain, 'utf8');
  const b = Buffer.from(plainEnv, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}
