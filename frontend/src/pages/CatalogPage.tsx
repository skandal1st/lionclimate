import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import SeoHead from '../components/SeoHead';
import { useContactModals } from '../context/ContactModalContext';
import { apiUrl } from '../api';
import { productImageUrl } from '../utils/productImageUrl';
import { productPublicPath } from '../utils/productUrl';
import type { Product } from '../types';

export default function CatalogPage() {
  const { openContact } = useContactModals();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);

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
            <div className="catalog-grid">
              {products.map((p) => {
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
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
