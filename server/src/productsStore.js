import './loadEnv.js';
import fs from 'fs';
import { resolveFromRoot } from './paths.js';

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
