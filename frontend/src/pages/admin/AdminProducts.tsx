import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SeoHead from '../../components/SeoHead';
import { apiFetch } from '../../api';
import type { Product } from '../../types';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/api/admin/products');
      if (!r.ok) throw new Error('Не удалось загрузить');
      const data = await r.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError('Ошибка загрузки списка');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Удалить товар?')) return;
    try {
      const r = await apiFetch(`/api/admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      await load();
    } catch {
      alert('Не удалось удалить');
    }
  }

  return (
    <div>
      <SeoHead title="Товары — админка Lion Climate" description="Управление каталогом кондиционеров." noindex />
      <div className="admin-topbar">
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Товары</h1>
        <Link to="/admin/products/new" className="admin-btn admin-btn-primary">
          + Добавить товар
        </Link>
      </div>
      {error && <div className="admin-error">{error}</div>}
      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Бренд</th>
                <th>Цена</th>
                <th>В каталоге</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.brand || '—'}</td>
                  <td>{p.price != null ? `${Number(p.price).toLocaleString('ru-RU')} ₽` : '—'}</td>
                  <td>{p.is_active !== false ? 'да' : 'нет'}</td>
                  <td>
                    <Link to={`/admin/products/${encodeURIComponent(p.id)}`} className="admin-btn admin-btn-secondary" style={{ marginRight: 8 }}>
                      Изменить
                    </Link>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={() => handleDelete(p.id)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <p style={{ padding: '1rem' }}>Товаров пока нет.</p>}
        </div>
      )}
    </div>
  );
}
