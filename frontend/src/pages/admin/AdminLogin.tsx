import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, login } from '../../api';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate('/admin/products', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      navigate('/admin/products', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <h1>Lion Climate</h1>
        <p className="muted">Вход в админ-панель</p>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="admin-password">Пароль</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              autoFocus
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: 14 }}>
          <a href="/" style={{ color: '#8ab4f8' }}>
            ← На сайт
          </a>
        </p>
      </div>
    </div>
  );
}
