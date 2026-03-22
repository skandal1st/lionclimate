import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <nav className="navbar">
        <div className="container">
          <div className="nav-wrapper">
            <div className="logo">
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h1>Lion Climate</h1>
                <p className="logo-subtitle">Продажа и установка кондиционеров</p>
              </Link>
            </div>
            <ul className={`nav-menu${menuOpen ? ' active' : ''}`}>
              <li>
                <Link to="/catalog" onClick={() => setMenuOpen(false)}>
                  Каталог
                </Link>
              </li>
              <li>
                <a href="/#services" onClick={() => setMenuOpen(false)}>
                  Услуги
                </a>
              </li>
              <li>
                <a href="/#advantages" onClick={() => setMenuOpen(false)}>
                  Преимущества
                </a>
              </li>
              <li>
                <a href="/#gallery" onClick={() => setMenuOpen(false)}>
                  Галерея
                </a>
              </li>
              <li>
                <a href="/#brands" onClick={() => setMenuOpen(false)}>
                  Бренды
                </a>
              </li>
              <li>
                <a href="/#reviews" onClick={() => setMenuOpen(false)}>
                  Отзывы
                </a>
              </li>
              <li>
                <a href="/#contacts" onClick={() => setMenuOpen(false)}>
                  Контакты
                </a>
              </li>
            </ul>
            <div className="nav-contact">
              <a href="/#contactModal" className="btn-primary nav-btn">
                Связаться
              </a>
              <a href="tel:+79688234573" className="nav-phone">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +7 968 823 45 73
              </a>
            </div>
            <button
              type="button"
              className={`mobile-menu-toggle${menuOpen ? ' active' : ''}`}
              aria-label="Меню"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
