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

function parseJsonResponse(raw: string): { success?: boolean; id?: number; error?: string } {
  try {
    return JSON.parse(raw) as { success?: boolean; id?: number; error?: string };
  } catch {
    const hint =
      raw.trimStart().startsWith('<!') || raw.trimStart().startsWith('<html')
        ? ' Сервер вернул HTML вместо JSON: обычно это значит, что запрос не дошёл до Node API (статика/nginx отдала страницу) или API не запущен на порту 3001.'
        : '';
    throw new Error(
      `Ответ сервера не JSON.${hint} Проверьте: на проде — systemctl status lionclimate-api и location /api/ в nginx; локально — запущен ли server и прокси в vite (npm run dev / preview с Node на 3001).`
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
  const r = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const raw = await r.text();
  const data = parseJsonResponse(raw);
  if (!r.ok) {
    throw new Error(data.error || 'Не удалось отправить заявку');
  }
  return { success: !!data.success, id: data.id };
}
