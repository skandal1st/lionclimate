/** Путь из API (`img/products/...`) → абсолютный URL от корня сайта, чтобы на /catalog и /product/... картинка не ломалась. */
export function productImageUrl(image: string | null | undefined): string {
  if (image == null) return '';
  const s = String(image).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  return s.startsWith('/') ? s : `/${s}`;
}
