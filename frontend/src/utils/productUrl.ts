import type { Product } from '../types';

/** Публичный путь карточки товара (ЧПУ slug или fallback на id). */
export function productPublicPath(p: Pick<Product, 'id' | 'slug'>): string {
  const seg = encodeURIComponent(p.slug || p.id);
  return `/product/${seg}`;
}
