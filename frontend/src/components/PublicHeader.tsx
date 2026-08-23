import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContactModals } from '../context/ContactModalContext';

const navLinks = [
  { href: '/catalog', label: 'Каталог', isRoute: true },
  { href: '/#services', label: 'Услуги' },
  { href: '/#advantages', label: 'Преимущества' },
  { href: '/#gallery', label: 'Галерея' },
  { href: '/#brands', label: 'Бренды' },
  { href: '/#reviews', label: 'Отзывы' },
  { href: '/#contacts', label: 'Контакты' },
];

function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#1747e0" />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M9 16c4-3 7 3 11 0s7-3 11 0" />
        <path d="M9 22c4-3 7 3 11 0s7-3 11 0" opacity=".6" />
      </g>
      <circle cx="20" cy="29.5" r="2.4" fill="#ff7a2f" />
    </svg>
  );
}

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openContact } = useContactModals();

  return (
    <header className="header">
      <nav className="navbar">
        <div className="container">
          <div className="nav-wrapper">
            <div className="logo">
              <Link to="/">
                <LogoMark />
                <span>
                  <span className="site-name">Lion Climate</span>
                  <span className="logo-subtitle">Кондиционеры · Москва и МО</span>
                </span>
              </Link>
            </div>

            <ul className={`nav-menu${menuOpen ? ' active' : ''}`}>
              {navLinks.map((l) =>
                l.isRoute ? (
                  <li key={l.href}>
                    <Link to={l.href} onClick={() => setMenuOpen(false)}>
                      {l.label}
                    </Link>
                  </li>
                ) : (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setMenuOpen(false)}>
                      {l.label}
                    </a>
                  </li>
                ),
              )}
            </ul>

            <div className="nav-contact">
              <a href="tel:+79688234573" className="nav-phone">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +7 968 823 45 73
              </a>
              <button
                type="button"
                className="btn-primary nav-btn"
                onClick={() => {
                  openContact();
                  setMenuOpen(false);
                }}
              >
                Заявка
              </button>
            </div>

            <button
              type="button"
              className={`mobile-menu-toggle${menuOpen ? ' active' : ''}`}
              aria-label="Меню"
              aria-expanded={menuOpen}
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
