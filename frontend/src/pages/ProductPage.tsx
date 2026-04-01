import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import SeoHead from '../components/SeoHead';
import { useContactModals } from '../context/ContactModalContext';
import { apiUrl } from '../api';
import { productImageUrl } from '../utils/productImageUrl';
import { productPublicPath } from '../utils/productUrl';
import type { Product } from '../types';

function productMetaTitle(p: Product) {
  const brand = p.brand ? ` ${p.brand}` : '';
  return `${p.name}${brand} — купить в Москве | Lion Climate`;
}

function productMetaDescription(p: Product) {
  const strip = (p.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (strip.length >= 50) return strip.slice(0, 160);
  return `${p.name}: розница и опт, доставка и установка в Москве и МО. Lion Climate.`.slice(0, 160);
}

export default function ProductPage() {
  const { openContact } = useContactModals();
  const location = useLocation();
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slugOrId) {
      setNotFound(true);
      setProduct(null);
      return;
    }
    fetch(apiUrl(`/api/products/${encodeURIComponent(slugOrId)}`))
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        if (data.error) {
          setNotFound(true);
          setProduct(null);
        } else {
          setProduct(data);
          setNotFound(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setProduct(null);
      });
  }, [slugOrId]);

  if (product && product.slug && slugOrId === product.id) {
    return <Navigate to={productPublicPath(product)} replace />;
  }

  const seo =
    product === undefined ? (
      <SeoHead
        title="Карточка товара — Lion Climate"
        description="Загрузка каталога кондиционеров Lion Climate."
        canonicalPath={`${location.pathname}${location.search}`}
      />
    ) : notFound || !product ? (
      <SeoHead
        title="Товар не найден — Lion Climate"
        description="Запрошенный товар отсутствует в каталоге. Выберите кондиционер в каталоге или свяжитесь с нами."
        noindex
      />
    ) : (
      <SeoHead
        title={productMetaTitle(product)}
        description={productMetaDescription(product)}
        canonicalPath={productPublicPath(product)}
      />
    );

  return (
    <>
      {seo}
      <PublicHeader />
      <main className="product-page-main">
        <div className="container">
          <nav className="product-breadcrumb">
            <Link to="/">Главная</Link>
            <span className="product-breadcrumb-sep">/</span>
            <Link to="/catalog">Каталог</Link>
            <span className="product-breadcrumb-sep">/</span>
            <span>{product?.name || 'Товар'}</span>
          </nav>

          {product === undefined && <div className="catalog-loading">Загрузка...</div>}
          {notFound && (
            <div className="catalog-empty">
              <p>Товар не найден.</p>
              <Link to="/catalog" className="btn-primary">
                В каталог
              </Link>
            </div>
          )}
          {product && (
            <article className="product-card" style={{ display: 'block' }}>
              <div className="product-card-layout">
                <div className="product-card-left">
                  {product.image ? (
                    <div className="product-card-gallery">
                      <img src={productImageUrl(product.image)} alt={product.name} loading="eager" />
                    </div>
                  ) : (
                    <div className="product-card-gallery product-card-no-image">
                      <span>Нет фото</span>
                    </div>
                  )}
                </div>
                <div className="product-card-right">
                  <h1 className="product-card-title">{product.name}</h1>
                  {product.brand && (
                    <p className="product-card-brand">
                      {product.brand}
                      {product.model ? ` ${product.model}` : ''}
                    </p>
                  )}
                  {product.price != null ? (
                    <div className="product-card-price">{Number(product.price).toLocaleString('ru-RU')} ₽</div>
                  ) : (
                    <div className="product-card-price">Цена по запросу</div>
                  )}
                  <div className="product-card-actions">
                    <button type="button" className="btn-primary product-card-btn" onClick={openContact}>
                      Узнать цену / Заказать
                    </button>
                    <a href="tel:+79688234573" className="btn-secondary product-card-btn">
                      Позвонить
                    </a>
                  </div>
                </div>
              </div>
              {(product.description || (product.characteristics && product.characteristics.length > 0)) && (
                <div className="product-card-bottom">
                  {product.description && (
                    <div className="product-card-section">
                      <h3>Описание</h3>
                      <div className="product-card-description">{product.description}</div>
                    </div>
                  )}
                  {product.characteristics && product.characteristics.length > 0 && (
                    <div className="product-card-section">
                      <h3>Характеристики</h3>
                      <ul className="product-card-chars">
                        {product.characteristics.map((c, i) => (
                          <li key={i}>
                            <strong>{c.name || ''}</strong> {c.value || ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
