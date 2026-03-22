import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import type { CrmCustomField, Lead, LeadStatus } from '../../types';

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Завершена' },
  { value: 'spam', label: 'Спам' },
];

function extraFromLead(raw: Lead['deal_extra']): Record<string, string> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      o[k] = v == null ? '' : String(v);
    }
    return o;
  }
  return {};
}

type Props = {
  lead: Lead;
  crmFields: CrmCustomField[];
  onClose: () => void;
  onSaved: (updated: Lead) => void;
};

export default function DealCardModal({ lead, crmFields, onClose, onSaved }: Props) {
  const [dealAddress, setDealAddress] = useState(lead.deal_address || '');
  const [dealAcModel, setDealAcModel] = useState(lead.deal_ac_model || '');
  const [dealExtra, setDealExtra] = useState<Record<string, string>>(() => extraFromLead(lead.deal_extra));
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDealAddress(lead.deal_address || '');
    setDealAcModel(lead.deal_ac_model || '');
    setDealExtra(extraFromLead(lead.deal_extra));
    setStatus(lead.status);
    setNotes(lead.notes || '');
  }, [lead]);

  useEffect(() => {
    setDealExtra((prev) => {
      const next = { ...prev };
      for (const f of crmFields) {
        if (!(f.field_key in next)) next[f.field_key] = '';
      }
      return next;
    });
  }, [crmFields]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSave() {
    const extra: Record<string, string> = {};
    for (const f of crmFields) {
      extra[f.field_key] = dealExtra[f.field_key] ?? '';
    }
    setSaving(true);
    try {
      const r = await apiFetch(`/api/admin/leads/${lead.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          deal_address: dealAddress || null,
          deal_ac_model: dealAcModel || null,
          deal_extra: extra,
          status,
          notes: notes || null,
        }),
      });
      if (!r.ok) throw new Error();
      const updated = (await r.json()) as Lead;
      onSaved(updated);
      onClose();
    } catch {
      alert('Не удалось сохранить сделку');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-modal admin-deal-card"
        role="dialog"
        aria-labelledby="deal-card-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h2 id="deal-card-title">Сделка</h2>
          <button type="button" className="admin-modal-close" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-deal-grid">
            <div className="admin-form-group">
              <label>Клиент</label>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{lead.name}</div>
            </div>
            <div className="admin-form-group">
              <label>Телефон</label>
              <a href={`tel:${lead.phone}`} style={{ color: '#8ab4f8', fontSize: 15 }}>
                {lead.phone}
              </a>
            </div>
            <div className="admin-form-group">
              <label htmlFor="deal-address">Адрес объекта</label>
              <input
                id="deal-address"
                value={dealAddress}
                onChange={(e) => setDealAddress(e.target.value)}
                placeholder="Город, улица, подъезд…"
              />
            </div>
            <div className="admin-form-group">
              <label htmlFor="deal-ac">Модель кондиционера</label>
              <input
                id="deal-ac"
                value={dealAcModel}
                onChange={(e) => setDealAcModel(e.target.value)}
                placeholder="Например, Daikin FTXM35R"
              />
            </div>
            {crmFields.map((f) => (
              <div key={f.field_key} className="admin-form-group">
                <label htmlFor={`extra-${f.field_key}`}>{f.label}</label>
                <input
                  id={`extra-${f.field_key}`}
                  value={dealExtra[f.field_key] ?? ''}
                  onChange={(e) => setDealExtra((prev) => ({ ...prev, [f.field_key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="admin-form-group">
              <label htmlFor="deal-status">Статус</label>
              <select id="deal-status" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="deal-notes">Заметки</label>
              <textarea id="deal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
          </div>
        </div>
        <div className="admin-modal-foot">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={saving}>
            Отмена
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
