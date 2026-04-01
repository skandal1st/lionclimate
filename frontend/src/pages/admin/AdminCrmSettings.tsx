import { useEffect, useState } from 'react';
import SeoHead from '../../components/SeoHead';
import { apiFetch } from '../../api';
import type { CrmCustomField } from '../../types';

function randomKey() {
  const a = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now());
  return `f_${a.replace(/-/g, '')}`;
}

export default function AdminCrmSettings() {
  const [fields, setFields] = useState<CrmCustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await apiFetch('/api/admin/crm-fields');
      if (!r.ok) throw new Error();
      const data = await r.json();
      setFields(Array.isArray(data) ? data : []);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    setFields(next);
  }

  function removeAt(i: number) {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLabel(i: number, label: string) {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, label } : f)));
  }

  function addField() {
    const label = newLabel.trim();
    if (!label) return;
    setFields((prev) => [
      ...prev,
      {
        id: -Date.now(),
        field_key: randomKey(),
        label,
        sort_order: prev.length,
      },
    ]);
    setNewLabel('');
  }

  async function saveAll() {
    setSaving(true);
    try {
      const r = await apiFetch('/api/admin/crm-fields', {
        method: 'PUT',
        body: JSON.stringify({
          fields: fields.map((f) => ({
            field_key: f.field_key,
            label: f.label.trim(),
          })),
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        alert((err as { error?: string }).error || 'Не удалось сохранить');
        return;
      }
      const data = await r.json();
      setFields(Array.isArray(data) ? data : []);
      alert('Сохранено');
    } catch {
      alert('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <SeoHead title="Поля сделки (CRM) — Lion Climate" description="Настройка дополнительных полей CRM." noindex />
      <div className="admin-topbar">
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Поля сделки (CRM)</h1>
      </div>
      <p className="muted" style={{ color: '#8a9', marginBottom: '1.25rem', maxWidth: 640 }}>
        Здесь задаются <strong>дополнительные поля</strong> для карточки сделки (кроме адреса и модели кондиционера — они
        фиксированы). Ключ поля генерируется автоматически; меняйте только подпись.
      </p>

      {loading ? (
        <p>Загрузка…</p>
      ) : (
        <>
          <div className="admin-crm-fields-list">
            {fields.map((f, i) => (
              <div key={f.field_key} className="admin-crm-field-row">
                <div className="admin-crm-field-move">
                  <button type="button" className="admin-btn admin-btn-secondary" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                </div>
                <div className="admin-form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label>Подпись поля</label>
                  <input value={f.label} onChange={(e) => updateLabel(i, e.target.value)} />
                </div>
                <code style={{ fontSize: 12, color: '#6b7', alignSelf: 'center' }} title="Ключ в базе">{f.field_key}</code>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => removeAt(i)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>

          <div className="admin-toolbar" style={{ marginTop: '1.25rem' }}>
            <div className="admin-form-group" style={{ marginBottom: 0, minWidth: 240, flex: 1 }}>
              <label>Новое поле — подпись</label>
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Например: Этаж" />
            </div>
            <button type="button" className="admin-btn admin-btn-secondary" style={{ alignSelf: 'flex-end' }} onClick={addField}>
              Добавить поле
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              style={{ alignSelf: 'flex-end' }}
              disabled={saving}
              onClick={saveAll}
            >
              {saving ? 'Сохранение…' : 'Сохранить список'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
