import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import SeoHead from '../components/SeoHead';
import { useContactModals } from '../context/ContactModalContext';
import { apiUrl } from '../api';
import { productImageUrl } from '../utils/productImageUrl';
import { productPublicPath } from '../utils/productUrl';
import type { Product } from '../types';

const PLOSHAD_KEY = 'ploshad_m2';

/** Парсинг «Площадь, м²»: одно число → до N м²; два — диапазон. */
function parsePloshadRange(raw: string | undefined): { min: number; max: number } | null {
  if (!raw) return null;
  const nums = String(raw).match(/\d+(?:[.,]\d+)?/g);
  if (!nums?.length) return null;
  const values = nums.map((n) => parseFloat(n.replace(',', '.'))).filter((x) => !Number.isNaN(x));
  if (values.length === 0) return null;
  if (values.length >= 2) {
    const a = Math.min(...values);
    const b = Math.max(...values);
    return { min: a, max: b };
  }
  const n = values[0];
  return { min: 0, max: n };
}

function getProductPloshadRange(p: Product): { min: number; max: number } | null {
  const chars = p.characteristics;
  if (!chars?.length) return null;
  const row = chars.find((c) => c.key === PLOSHAD_KEY);
  return parsePloshadRange(row?.value);
}

function rangesOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number },
): boolean {
  return a.max >= b.min && a.min <= b.max;
}

const AREA_PRESETS: { id: string; label: string; range: { min: number; max: number } | null }[] = [
  { id: 'all', label: 'Любая площадь', range: null },
  { id: 'to20', label: 'до 20 м²', range: null },
  { id: '20_28', label: '20–28 м²', range: { min: 20, max: 28 } },
  { id: '28_35', label: '28–35 м²', range: { min: 28, max: 35 } },
  { id: '35_50', label: '35–50 м²', range: { min: 35, max: 50 } },
  { id: 'from50', label: 'свыше 50 м²', range: null },
];

/**
 * «до 20 м²» — только модели с паспортным максимумом ≤ 20 (не «пересечение» с [0,28]).
 * Средние диапазоны — пересечение с ожидаемой площадью помещения.
 * «свыше 50 м²» — модель рассчитана минимум на такую площадь (max ≥ 50).
 */
function matchesAreaPreset(
  presetId: string,
  pr: { min: number; max: number } | null,
): boolean {
  if (presetId === 'all') return true;
  if (!pr) return false;
  if (presetId === 'to20') return pr.max <= 20;
  if (presetId === 'from50') return pr.max >= 50;
  const preset = AREA_PRESETS.find((x) => x.id === presetId);
  const band = preset?.range;
  if (!band) return true;
  return rangesOverlap(pr, band);
}

export default function CatalogPage() {
  const { openContact } = useContactModals();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [brandId, setBrandId] = useState<string>('all');
  const [areaPresetId, setAreaPresetId] = useState<string>('all');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  useEffect(() => {
    fetch(apiUrl('/api/products'))
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError(true);
        setProducts([]);
      });
  }, []);

  const brandOptions = useMemo(() => {
    if (!products?.length) return [];
    const set = new Set<string>();
    for (const p of products) {
      const b = (p.brand || '').trim();
      if (b) set.add(b);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!products?.length) return [];
    const pMin = priceMin.trim() === '' ? null : Number(priceMin.replace(/\s/g, '').replace(',', '.'));
    const pMax = priceMax.trim() === '' ? null : Number(priceMax.replace(/\s/g, '').replace(',', '.'));
    const hasPriceFilter =
      (pMin != null && !Number.isNaN(pMin)) || (pMax != null && !Number.isNaN(pMax));

    return products.filter((p) => {
      if (brandId !== 'all') {
        if ((p.brand || '').trim() !== brandId) return false;
      }
      if (areaPresetId !== 'all') {
        const pr = getProductPloshadRange(p);
        if (!matchesAreaPreset(areaPresetId, pr)) return false;
      }
      if (hasPriceFilter) {
        if (p.price == null || Number.isNaN(Number(p.price))) return false;
        const price = Number(p.price);
        if (pMin != null && !Number.isNaN(pMin) && price < pMin) return false;
        if (pMax != null && !Number.isNaN(pMax) && price > pMax) return false;
      }
      return true;
    });
  }, [products, brandId, areaPresetId, priceMin, priceMax]);

  const filtersActive =
    brandId !== 'all' || areaPresetId !== 'all' || priceMin.trim() !== '' || priceMax.trim() !== '';

  const resetFilters = () => {
    setBrandId('all');
    setAreaPresetId('all');
    setPriceMin('');
    setPriceMax('');
  };

  return (
    <>
      <SeoHead
        title="Каталог кондиционеров в Москве и МО — Lion Climate"
        description="Сплит-системы в розницу и оптом в Москве и Московской области. Доставка, профессиональная установка и сервис."
        canonicalPath="/catalog"
      />
      <PublicHeader />
      <main className="catalog-main">
        <div className="container">
          <h1 className="catalog-title">Каталог кондиционеров</h1>
          <p className="catalog-description">
            Широкий выбор сплит-систем в Москве и Московской области. Розница и опт. Доставка и установка.
          </p>

          {products === null && <div className="catalog-loading">Загрузка каталога...</div>}
          {error && <p className="catalog-description">Не удалось загрузить каталог. Попробуйте позже.</p>}
          {products && products.length === 0 && (
            <div className="catalog-empty">
              <p>В каталоге пока нет товаров.</p>
              <p>Свяжитесь с нами — подберём кондиционер под ваши задачи.</p>
              <a href="tel:+79688234573" className="btn-primary">
                Позвонить
              </a>
            </div>
          )}
          {products && products.length > 0 && (
            <>
              <div className="catalog-filters" aria-label="Фильтры каталога">
                <div className="catalog-filters-row">
                  <label className="catalog-filter-field">
                    <span className="catalog-filter-label">Бренд</span>
                    <select
                      className="catalog-filter-select"
                      value={brandId}
                      onChange={(e) => setBrandId(e.target.value)}
                    >
                      <option value="all">Все бренды</option>
                      {brandOptions.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="catalog-filter-field">
                    <span className="catalog-filter-label">Площадь помещения</span>
                    <select
                      className="catalog-filter-select"
                      value={areaPresetId}
                      onChange={(e) => setAreaPresetId(e.target.value)}
                    >
                      {AREA_PRESETS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="catalog-filter-field catalog-filter-prices">
                    <span className="catalog-filter-label">Цена, ₽</span>
                    <div className="catalog-filter-price-inputs">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="catalog-filter-input"
                        placeholder="от"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        aria-label="Цена от"
                      />
                      <span className="catalog-filter-price-sep">—</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        className="catalog-filter-input"
                        placeholder="до"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        aria-label="Цена до"
                      />
                    </div>
                  </div>
                  {filtersActive && (
                    <button type="button" className="btn-secondary catalog-filters-reset" onClick={resetFilters}>
                      Сбросить
                    </button>
                  )}
                </div>
              </div>
              {filteredProducts.length === 0 && (
                <div className="catalog-empty catalog-empty-filtered">
                  <p>По выбранным фильтрам ничего не найдено.</p>
                  <button type="button" className="btn-primary" onClick={resetFilters}>
                    Сбросить фильтры
                  </button>
                </div>
              )}
              {filteredProducts.length > 0 && (
            <div className="catalog-grid">
              {filteredProducts.map((p) => {
                const productUrl = productPublicPath(p);
                const imgSrc = productImageUrl(p.image);
                return (
                  <div key={p.id} className="catalog-card">
                    {imgSrc ? (
                      <Link to={productUrl} className="catalog-card-image">
                        <img src={imgSrc} alt={p.name} loading="lazy" />
                      </Link>
                    ) : (
                      <div className="catalog-card-image catalog-card-no-image">
                        <span>Нет фото</span>
                      </div>
                    )}
                    <div className="catalog-card-body">
                      <Link to={productUrl} className="catalog-card-title-link">
                        <h2 className="catalog-card-title">{p.name}</h2>
                      </Link>
                      {p.brand && (
                        <p className="catalog-card-brand">
                          {p.brand}
                          {p.model ? ` ${p.model}` : ''}
                        </p>
                      )}
                      {p.characteristics && p.characteristics.length > 0 && (
                        <ul className="catalog-card-chars">
                          {p.characteristics.slice(0, 4).map((c, i) => (
                            <li key={i}>
                              <strong>{c.name || ''}</strong> {c.value || ''}
                            </li>
                          ))}
                        </ul>
                      )}
                      {p.price != null && (
                        <div className="catalog-card-price">{Number(p.price).toLocaleString('ru-RU')} ₽</div>
                      )}
                      <Link to={productUrl} className="btn-secondary catalog-card-btn catalog-card-btn-view">
                        Подробнее
                      </Link>
                      <button type="button" className="btn-primary catalog-card-btn" onClick={openContact}>
                        Узнать цену / Заказать
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
              )}
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
