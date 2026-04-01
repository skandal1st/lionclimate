/** Транслитерация и ЧПУ для URL товаров (латиница, дефисы). */

const CYR = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/**
 * @param {string} str
 */
export function slugify(str) {
  let s = String(str || '')
    .toLowerCase()
    .trim();
  let out = '';
  for (const ch of s) {
    if (CYR[ch] !== undefined) out += CYR[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += '-';
  }
  out = out
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return out.slice(0, 100) || 'item';
}

/**
 * Стабильный slug: читаемая часть + уникальный хвост из id.
 * @param {{ id?: string, name?: string, brand?: string, model?: string }} p
 */
export function computeProductSlug(p) {
  const idClean = String(p.id || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-32);
  const readable = slugify([p.brand, p.model, p.name].filter(Boolean).join(' '));
  const base = readable && readable !== 'item' ? readable : 'tovar';
  return `${base}-${idClean}`.toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 160);
}
