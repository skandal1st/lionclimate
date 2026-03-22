import { useEffect, useState } from 'react';
import { apiFetch } from '../../api';
import type { Lead, LeadStatus } from '../../types';

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Завершена' },
  { value: 'spam', label: 'Спам' },
];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      if (formTypeFilter) q.set('formType', formTypeFilter);
      const r = await apiFetch(`/api/admin/leads?${q.toString()}`);
      if (!r.ok) throw new Error();
      const data = await r.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [statusFilter, formTypeFilter]);

  async function patchLead(id: number, patch: Partial<Pick<Lead, 'status' | 'notes'>>) {
    setSavingId(id);
    try {
      const r = await apiFetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error();
      const updated = await r.json();
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch {
      alert('Не удалось сохранить');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Заявки (CRM)</h1>
      </div>
      <div className="admin-toolbar admin-filters">
        <label>
          Статус:{' '}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ marginLeft: 8, padding: '0.35rem', borderRadius: 6, background: '#0f1419', color: '#e8eaed', border: '1px solid #263041' }}
          >
            <option value="">Все</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Тип:{' '}
          <select
            value={formTypeFilter}
            onChange={(e) => setFormTypeFilter(e.target.value)}
            style={{ marginLeft: 8, padding: '0.35rem', borderRadius: 6, background: '#0f1419', color: '#e8eaed', border: '1px solid #263041' }}
          >
            <option value="">Все</option>
            <option value="contact">Заявка</option>
            <option value="consultation">Консультация</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Имя</th>
                <th>Телефон</th>
                <th>Услуга / вопрос</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Заметки</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(lead.created_at).toLocaleString('ru-RU')}
                  </td>
                  <td>{lead.name}</td>
                  <td>
                    <a href={`tel:${lead.phone}`} style={{ color: '#8ab4f8' }}>
                      {lead.phone}
                    </a>
                  </td>
                  <td style={{ maxWidth: 220, fontSize: 13 }}>
                    {lead.form_type === 'contact' ? (lead.service || '—') : (lead.message || '—')}
                  </td>
                  <td>{lead.form_type === 'consultation' ? 'Консультация' : 'Заявка'}</td>
                  <td>
                    <select
                      value={lead.status}
                      disabled={savingId === lead.id}
                      onChange={(e) => patchLead(lead.id, { status: e.target.value as LeadStatus })}
                      style={{ padding: '0.35rem', borderRadius: 6, background: '#0f1419', color: '#e8eaed', border: '1px solid #263041', maxWidth: 140 }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ minWidth: 200 }}>
                    <NotesCell lead={lead} disabled={savingId === lead.id} onSave={(notes) => patchLead(lead.id, { notes })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <p style={{ padding: '1rem' }}>Заявок нет.</p>}
        </div>
      )}
    </div>
  );
}

function NotesCell({
  lead,
  disabled,
  onSave,
}: {
  lead: Lead;
  disabled: boolean;
  onSave: (notes: string) => void;
}) {
  const [val, setVal] = useState(lead.notes || '');
  useEffect(() => {
    setVal(lead.notes || '');
  }, [lead.notes, lead.id]);

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <textarea
        value={val}
        disabled={disabled}
        onChange={(e) => setVal(e.target.value)}
        rows={2}
        style={{ flex: 1, minWidth: 120, fontSize: 13 }}
      />
      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        disabled={disabled || val === (lead.notes || '')}
        onClick={() => onSave(val)}
      >
        OK
      </button>
    </div>
  );
}
