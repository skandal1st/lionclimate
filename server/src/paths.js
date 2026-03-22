import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** server/src -> project root (lionclimate/) */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export function resolveFromRoot(rel) {
  return path.isAbsolute(rel) ? rel : path.join(PROJECT_ROOT, rel);
}
