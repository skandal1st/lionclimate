import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { useContactModals } from '../context/ContactModalContext';
import type { Product } from '../types';

export default function ProductPage() {
  const { openContact } = useContactModals();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setProduct(null);
      return;
    }
    fetch(`/api/products/${encodeURIComponent(id)}`)
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
  }, [id]);

  return (
    <>
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
                      <img src={product.image} alt="" loading="eager" />
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
