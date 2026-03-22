import { verifyToken } from '../auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1] : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.admin = payload;
  next();
}
