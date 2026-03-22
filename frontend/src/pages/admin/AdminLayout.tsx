import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../api';

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="admin-app">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <h2>Бэк-офис</h2>
          <nav>
            <NavLink to="/admin/products" className={({ isActive }) => (isActive ? 'active' : '')}>
              Товары
            </NavLink>
            <NavLink to="/admin/leads" className={({ isActive }) => (isActive ? 'active' : '')}>
              Заявки
            </NavLink>
          </nav>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={() => {
              logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            Выход
          </button>
          <p style={{ marginTop: '1rem' }}>
            <a href="/" style={{ color: '#8ab4f8', fontSize: 14 }}>
              На сайт
            </a>
          </p>
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
