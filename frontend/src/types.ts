export type LeadStatus = 'new' | 'in_progress' | 'done' | 'spam';

export interface Lead {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  service: string | null;
  message: string | null;
  form_type: string;
  status: LeadStatus;
  notes: string | null;
  source: string | null;
  deal_address?: string | null;
  deal_ac_model?: string | null;
  /** Значения доп. полей из настроек CRM (ключ = field_key) */
  deal_extra?: Record<string, string> | null;
}

export interface CrmCustomField {
  id: number;
  field_key: string;
  label: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  price?: number | null;
  description?: string;
  image?: string;
  characteristics?: { name?: string; key?: string; value?: string }[];
  is_active?: boolean;
  created_at?: string;
  supplier_url?: string;
}

export interface CharSchemaItem {
  key: string;
  label: string;
  placeholder?: string;
}
