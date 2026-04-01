import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SeoHead from '../../components/SeoHead';
import { apiFetch } from '../../api';
import type { CharSchemaItem, Product } from '../../types';
import { productImageUrl } from '../../utils/productImageUrl';

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
  /** Текущий путь/URL с сервера (после сохранения или при загрузке) */
  const [storedImage, setStoredImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
        setStoredImage(img || null);
        setImageUrl(/^https?:\/\//i.test(img) ? img : '');
        setPendingFile(null);
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

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function setChar(key: string, value: string) {
    setChars((prev) => ({ ...prev, [key]: value }));
  }

  async function apiErrorMessage(r: Response): Promise<string> {
    try {
      const j = (await r.json()) as { error?: string };
      return j.error || `Ошибка ${r.status}`;
    } catch {
      return `Ошибка ${r.status}`;
    }
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
      const basePayload: Record<string, unknown> = {
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        price: price === '' ? null : Number(price),
        description: description.trim(),
        image_url: pendingFile ? '' : imageUrl.trim(),
        supplier_url: supplierUrl.trim(),
        is_active: isActive,
        characteristics,
      };

      const useMultipart = !!pendingFile;

      if (useMultipart) {
        const fd = new FormData();
        fd.append('data', JSON.stringify(basePayload));
        fd.append('image', pendingFile);
        if (!isNew) {
          const r = await apiFetch(`/api/admin/products/${encodeURIComponent(id!)}`, {
            method: 'PUT',
            body: fd,
          });
          if (!r.ok) {
            alert(await apiErrorMessage(r));
            throw new Error('save');
          }
          const updated = (await r.json()) as Product;
          setStoredImage(updated.image || null);
          setPendingFile(null);
          if (updated.image && /^https?:\/\//i.test(updated.image)) {
            setImageUrl(updated.image);
          } else if (updated.image) {
            setImageUrl('');
          }
        } else {
          const r = await apiFetch('/api/admin/products', {
            method: 'POST',
            body: fd,
          });
          if (!r.ok) {
            alert(await apiErrorMessage(r));
            throw new Error('save');
          }
          const created = (await r.json()) as Product;
          navigate(`/admin/products/${encodeURIComponent(created.id)}`, { replace: true });
          return;
        }
      } else if (!isNew) {
        const r = await apiFetch(`/api/admin/products/json/${encodeURIComponent(id!)}`, {
          method: 'PUT',
          body: JSON.stringify(basePayload),
        });
        if (!r.ok) {
          alert(await apiErrorMessage(r));
          throw new Error('save');
        }
        const updated = (await r.json()) as Product;
        setStoredImage(updated.image || null);
        if (updated.image && /^https?:\/\//i.test(updated.image)) {
          setImageUrl(updated.image);
        }
      } else {
        const r = await apiFetch('/api/admin/products/json', {
          method: 'POST',
          body: JSON.stringify(basePayload),
        });
        if (!r.ok) {
          alert(await apiErrorMessage(r));
          throw new Error('save');
        }
        const created = (await r.json()) as Product;
        navigate(`/admin/products/${encodeURIComponent(created.id)}`, { replace: true });
        return;
      }
      navigate('/admin/products');
    } catch (e) {
      if (e instanceof Error && e.message === 'save') return;
      alert('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <SeoHead title="Загрузка товара — Lion Climate" noindex />
        <p>Загрузка...</p>
      </>
    );
  }

  return (
    <div>
      <SeoHead
        title={isNew ? 'Новый товар — Lion Climate' : 'Редактирование товара — Lion Climate'}
        description="Управление карточкой товара в каталоге."
        noindex
      />
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
          <label>Фото товара (файл)</label>
          <div className="admin-product-image-row">
            <div className="admin-product-image-preview">
              {(previewUrl || (storedImage ? productImageUrl(storedImage) : '') || imageUrl) ? (
                <img
                  src={previewUrl || productImageUrl(storedImage || '') || imageUrl}
                  alt=""
                  style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid #263041' }}
                />
              ) : (
                <span style={{ color: '#8a9', fontSize: 14 }}>Превью появится после выбора файла или URL</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
              />
              {pendingFile && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => setPendingFile(null)}
                >
                  Отменить выбор файла
                </button>
              )}
              <span style={{ fontSize: 12, color: '#8a9' }}>
                JPG, PNG, GIF, WebP, до ~8 МБ. Файл сохранится в <code>img/products/</code> на сервере.
              </span>
            </div>
          </div>
        </div>
        <div className="admin-form-group">
          <label htmlFor="p-img-url">Или URL изображения (внешняя ссылка)</label>
          <input
            id="p-img-url"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            disabled={!!pendingFile}
          />
          {pendingFile && <span style={{ fontSize: 12, color: '#f5d76e' }}>При сохранении будет использован загруженный файл, не URL.</span>}
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
