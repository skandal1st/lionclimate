const TOKEN_KEY = 'lionclimate_admin_token';

/** Пусто = тот же origin (`/api/...`). Иначе полный URL бэкенда, например `https://lionclimate.ru` (без слэша в конце). */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(apiUrl(path), { ...init, headers });
}

export async function login(password: string): Promise<string> {
  const r = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    const msg = (err as { error?: string }).error || 'Ошибка входа';
    if (r.status === 503) {
      throw new Error(
        'Сервер не настроен: в server/.env нет ADMIN_PASSWORD_HASH или ADMIN_PASSWORD. См. NODE_DEPLOY.md'
      );
    }
    throw new Error(msg);
  }
  const data = (await r.json()) as { token: string };
  setToken(data.token);
  return data.token;
}

export function logout() {
  setToken(null);
}

function parseJsonResponse(
  raw: string,
  httpStatus?: number
): { success?: boolean; id?: number; error?: string } {
  try {
    return JSON.parse(raw) as { success?: boolean; id?: number; error?: string };
  } catch {
    const looksHtml = /^\s*</.test(raw);
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[lionclimate] Ответ не JSON (часто HTML: nginx/502 или index.html вместо API). HTTP status:',
        httpStatus,
        '— проверьте: curl -sS http://127.0.0.1:3001/api/health и через домен; systemctl restart lionclimate-api; nginx location ^~ /api/ → proxy_pass 127.0.0.1:3001',
        looksHtml ? { preview: raw.slice(0, 200) } : undefined
      );
    }
    throw new Error(
      'Не удалось отправить заявку. Попробуйте позже или позвоните: +7 968 823 45 73'
    );
  }
}

export async function submitLead(payload: {
  name: string;
  phone: string;
  service?: string;
  message?: string;
  formType: 'contact' | 'consultation';
  source?: string;
}): Promise<{ success: boolean; id?: number }> {
  const r = await fetch(apiUrl('/api/leads'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const raw = await r.text();
  const data = parseJsonResponse(raw, r.status);
  if (!r.ok) {
    throw new Error(data.error || 'Не удалось отправить заявку');
  }
  return { success: !!data.success, id: data.id };
}
