const TOKEN_KEY = 'lionclimate_admin_token';

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
  return fetch(path, { ...init, headers });
}

export async function login(password: string): Promise<string> {
  const r = await fetch('/api/auth/login', {
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

export async function submitLead(payload: {
  name: string;
  phone: string;
  service?: string;
  message?: string;
  formType: 'contact' | 'consultation';
  source?: string;
}): Promise<{ success: boolean; id?: number }> {
  const r = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await r.json()) as { success?: boolean; id?: number; error?: string };
  if (!r.ok) {
    throw new Error(data.error || 'Не удалось отправить заявку');
  }
  return { success: !!data.success, id: data.id };
}
