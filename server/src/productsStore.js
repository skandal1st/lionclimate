import './loadEnv.js';
import fs from 'fs';
import { resolveFromRoot } from './paths.js';
import { computeProductSlug } from './slug.js';

function productsPath() {
  const rel = process.env.PRODUCTS_FILE || 'data/products.json';
  return resolveFromRoot(rel);
}

export function readProducts() {
  const file = productsPath();
  if (!fs.existsSync(file)) {
    return [];
  }
  const json = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(json);
  return Array.isArray(data) ? data : [];
}

export function writeProducts(products) {
  const file = productsPath();
  const dir = file.replace(/\/[^/]+$/, '');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const json = JSON.stringify(products, null, 2);
  fs.writeFileSync(file, json, 'utf8');
}

export function getUploadDir() {
  const rel = process.env.UPLOAD_DIR || 'img/products/';
  return resolveFromRoot(rel.replace(/^\.\.\//, ''));
}

export function getUploadUrl() {
  return (process.env.UPLOAD_URL || 'img/products/').replace(/\/?$/, '/') ;
}

/** Дописывает slug у товаров без slug (миграция и консистентность). */
export function ensureProductSlugs() {
  const products = readProducts();
  let changed = false;
  for (const p of products) {
    if (!p.slug || String(p.slug).trim() === '') {
      p.slug = computeProductSlug(p);
      changed = true;
    }
  }
  if (changed) {
    writeProducts(products);
  }
}

/** Поиск товара по id или ЧПУ-slug. */
export function findProductByIdOrSlug(products, param) {
  const decoded = decodeURIComponent(param);
  return products.find((x) => x.id === decoded || x.slug === decoded);
}
