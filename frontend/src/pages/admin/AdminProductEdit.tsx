import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../api';
import type { CharSchemaItem, Product } from '../../types';

const emptyChars: Record<string, string> = {};

export default function AdminProductEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [schema, setSchema] = useState<CharSchemaItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [chars, setChars] = useState<Record<string, string>>(emptyChars);

  useEffect(() => {
    apiFetch('/api/admin/schema/characteristics')
      .then((r) => r.json())
      .then((data) => setSchema(Array.isArray(data) ? data : []))
      .catch(() => setSchema([]));
  }, []);

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }
    setLoading(true);
    apiFetch(`/api/admin/products/${encodeURIComponent(id!)}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((p: Product) => {
        setName(p.name || '');
        setBrand(p.brand || '');
        setModel(p.model || '');
        setPrice(p.price != null ? String(p.price) : '');
        setDescription(p.description || '');
        const img = p.image || '';
        setImageUrl(/^https?:\/\//i.test(img) ? img : '');
        setSupplierUrl(p.supplier_url || '');
        setIsActive(p.is_active !== false);
        const map: Record<string, string> = {};
        for (const c of p.characteristics || []) {
          if (c.key) map[c.key] = c.value || '';
        }
        setChars(map);
      })
      .catch(() => {
        alert('Товар не найден');
        navigate('/admin/products');
      })
      .finally(() => setLoading(false));
  }, [id, isNew, navigate]);

  function setChar(key: string, value: string) {
    setChars((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      alert('Укажите название');
      return;
    }
    setSaving(true);
    try {
      const characteristics: Record<string, string> = {};
      for (const [k, v] of Object.entries(chars)) {
        if (String(v).trim()) characteristics[k] = String(v).trim();
      }
      const body: Record<string, unknown> = {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        price: price === '' ? null : Number(price),
        description: description.trim(),
        image_url: imageUrl.trim(),
        supplier_url: supplierUrl.trim(),
        is_active: isActive,
        characteristics,
      };
      if (!isNew) {
        const r = await apiFetch(`/api/admin/products/json/${encodeURIComponent(id!)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error();
      } else {
        const r = await apiFetch('/api/admin/products/json', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error();
        const created = await r.json();
        navigate(`/admin/products/${encodeURIComponent(created.id)}`, { replace: true });
        return;
      }
      navigate('/admin/products');
    } catch {
      alert('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Загрузка...</p>;
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>{isNew ? 'Новый товар' : 'Редактирование'}</h1>
        <Link to="/admin/products" className="admin-btn admin-btn-secondary">
          ← К списку
        </Link>
      </div>

      <form className="product-form-admin" onSubmit={handleSubmit}>
        <div className="admin-form-group">
          <label htmlFor="p-name">Название *</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="admin-form-group">
            <label htmlFor="p-brand">Бренд</label>
            <input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="p-model">Модель</label>
            <input id="p-model" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <div className="admin-form-group">
          <label htmlFor="p-price">Цена (₽)</label>
          <input id="p-price" type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label htmlFor="p-desc">Описание</label>
          <textarea id="p-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="admin-form-group">
          <label htmlFor="p-img-url">URL изображения</label>
          <input id="p-img-url" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="admin-form-group">
          <label>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Показывать в каталоге
          </label>
        </div>
        <div className="admin-form-group">
          <label htmlFor="p-supplier">Ссылка на поставщика</label>
          <input id="p-supplier" type="url" value={supplierUrl} onChange={(e) => setSupplierUrl(e.target.value)} />
        </div>

        <h3 style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>Характеристики</h3>
        <div className="chars-grid-admin">
          {schema.map((item) => (
            <div key={item.key} className="admin-form-group">
              <label htmlFor={`char-${item.key}`}>{item.label}</label>
              <input
                id={`char-${item.key}`}
                value={chars[item.key] || ''}
                onChange={(e) => setChar(item.key, e.target.value)}
                placeholder={item.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <Link to="/admin/products" className="admin-btn admin-btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
