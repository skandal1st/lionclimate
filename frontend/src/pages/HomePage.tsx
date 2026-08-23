import { useEffect, useState } from 'react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import SeoHead from '../components/SeoHead';
import { useContactModals } from '../context/ContactModalContext';

/* Тонкие штриховые иконки в одной сетке 24×24, stroke=currentColor */
const icons: Record<string, JSX.Element> = {
  sale: (
    <svg viewBox="0 0 24 24"><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1.4" /></svg>
  ),
  install: (
    <svg viewBox="0 0 24 24"><path d="M14.5 5.5a3.5 3.5 0 0 0-4.8 4.3l-6 6 2 2 6-6a3.5 3.5 0 0 0 4.3-4.8l-2.2 2.2-1.9-.4-.4-1.9 2.2-2.2Z" /></svg>
  ),
  mount: (
    <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="8" rx="2" /><path d="M6 16c1.2 1.2 2.4 1.2 3.6 0M14.4 16c1.2 1.2 2.4 1.2 3.6 0M7 9h4" /></svg>
  ),
  clean: (
    <svg viewBox="0 0 24 24"><path d="M12 3v3M6 6l1.5 1.5M18 6l-1.5 1.5" /><path d="M9 10h6l-.7 8.5a1.6 1.6 0 0 1-1.6 1.5h-1.4a1.6 1.6 0 0 1-1.6-1.5L9 10Z" /></svg>
  ),
  gas: (
    <svg viewBox="0 0 24 24"><path d="M12 3s5 5.5 5 9.5A5 5 0 0 1 7 12.5C7 8.5 12 3 12 3Z" /><path d="M12 17.5a2 2 0 0 0 2-2" /></svg>
  ),
  service: (
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4 5.3 5.3" /></svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24"><path d="M2 6h11v9H2zM13 9h4l3 3v3h-7z" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8L12 3Z" /><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24"><path d="M12 3l7 2.5V11c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V5.5L12 3Z" /><path d="M9 12l2 2 4-4" /></svg>
  ),
};

const services = [
  { ic: 'sale', title: 'Продажа кондиционеров', text: 'Розница и опт: сплит-системы ведущих брендов с доставкой по Москве и области.' },
  { ic: 'install', title: 'Установка «под ключ»', text: 'Профессиональный монтаж любой сложности с гарантией на работы 1,5 года.' },
  { ic: 'mount', title: 'Монтаж в МО', text: 'Аккуратно выведем трассу, закрепим блоки и запустим систему за один день.' },
  { ic: 'clean', title: 'Чистка и антибактериальная обработка', text: 'Профессиональная мойка без грязи и пыли — специальным оборудованием.' },
  { ic: 'gas', title: 'Заправка фреоном', text: 'Дозаправка и проверка герметичности контура с диагностикой давления.' },
  { ic: 'service', title: 'Сервис и профилактика', text: 'Плановое обслуживание, чтобы система работала тихо и служила дольше.' },
];

const advantages = [
  { ic: 'truck', title: 'Быстрый выезд', text: 'Приедем в удобное время — без выходных и задержек.' },
  { ic: 'sparkle', title: 'Аккуратность и чистота', text: 'После монтажа убираем пыль и грязь профессиональным пылесосом.' },
  { ic: 'shield', title: 'Гарантия на монтаж 1,5 года', text: 'Отвечаем за качество работ и надёжность каждого узла.' },
];

const galleryPhotos = [
  'photo_2026-01-16_10-16-39.jpg',
  'photo_2026-01-16_10-16-38.jpg',
  'photo_2026-01-16_10-16-31.jpg',
  'photo_2026-01-16_10-16-30.jpg',
  'photo_2026-01-16_10-16-45.jpg',
  'photo_2026-01-16_10-16-43.jpg',
  'photo_2026-01-16_10-16-41.jpg',
  'photo_2026-01-15_23-20-32.jpg',
  'photo_2026-01-15_23-18-20.jpg',
];

const galleryMods = ['wide', '', '', 'tall', '', 'wide', '', '', ''];

const brands: [string, string][] = [
  ['Бренды/png-clipart-daikin-applied-americas-business-air-conditioning-heat-pump-business-blue-text.png', 'Daikin'],
  ['Бренды/png-transparent-hitachi-hd-logo-thumbnail.png', 'Hitachi'],
  ['Бренды/Samsung_old_logo_before_year_2015.svg.png', 'Samsung'],
  ['Бренды/7011.T-527f6e23.png', 'MDV'],
];

const reviews = [
  { author: 'Дмитрий', date: '25.10.2025', text: 'Честный и порядочный человек, мастер своего дела. Быстро, качественно и по хорошей цене.' },
  { author: 'Тимофей Волков', date: '26.09.2025', text: 'Всё чётко: быстро сняли старый блок, всё рассказали и подсказали по новому.' },
];

export default function HomePage() {
  const { openContact, openConsult } = useContactModals();
  const [cookieBanner, setCookieBanner] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) {
      const t = setTimeout(() => setCookieBanner(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  // Мотив «подъёма изотерм»: контент проявляется при входе во вьюпорт
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <SeoHead
        title="Lion Climate — продажа и установка кондиционеров в Москве и МО"
        description="Розничная и оптовая продажа кондиционеров в Москве и Московской области. Монтаж и обслуживание с гарантией 1,5 года. Daikin, Hitachi, Samsung, MDV."
        canonicalPath="/"
      />
      {cookieBanner && (
        <div id="cookieBanner" className="cookie-banner show">
          <div className="cookie-content">
            <p>
              Мы используем файлы cookie, чтобы сайт работал лучше. Продолжая, вы соглашаетесь с{' '}
              <a href="#" id="cookiePolicy" onClick={(e) => e.preventDefault()}>
                политикой обработки данных
              </a>
              .
            </p>
            <button
              type="button"
              id="acceptCookies"
              className="btn-accept"
              onClick={() => {
                localStorage.setItem('cookieConsent', 'true');
                setCookieBanner(false);
              }}
            >
              Принять
            </button>
          </div>
        </div>
      )}

      <PublicHeader />

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">
                Кондиционеры <span className="warm">с установкой</span> в Москве и области
              </h1>
              <p className="hero-description">
                Продаём в розницу и оптом, монтируем «под ключ» и обслуживаем сплит-системы. Гарантия на работы —
                1,5 года. Выезд по всей Московской области.
              </p>
              <div className="hero-buttons">
                <button type="button" className="btn-primary btn-large" onClick={openContact}>
                  Подобрать кондиционер
                </button>
                <button type="button" className="btn-secondary btn-large" onClick={openConsult}>
                  Рассчитать стоимость
                </button>
              </div>
              <div className="hero-facts">
                <span className="hero-fact">
                  <b>7</b> лет на рынке
                </span>
                <span className="hero-fact">
                  <b>1,5</b> года гарантии
                </span>
                <span className="hero-fact">
                  <b>5.0</b> рейтинг на Авито
                </span>
              </div>
            </div>

            {/* Прибор-термостат — сигнатурный момент */}
            <div className="instrument" aria-hidden="true">
              <div className="instrument-top">
                <span className="mono-label">Климат-режим</span>
                <span className="instrument-live">online</span>
              </div>
              <svg className="gauge" viewBox="0 0 220 128">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#2f6bff" />
                    <stop offset="0.55" stopColor="#8fb0ff" />
                    <stop offset="1" stopColor="#ff7a2f" />
                  </linearGradient>
                </defs>
                <path className="gauge-track" d="M30 116 A 80 80 0 0 1 190 116" />
                <path className="gauge-fill" d="M30 116 A 80 80 0 0 1 190 116" stroke="url(#gaugeGrad)" />
                <circle cx="146" cy="45" r="7" fill="#fff" stroke="#ff7a2f" strokeWidth="3" />
              </svg>
              <div className="gauge-readout">
                <div className="gauge-temp">
                  22<sup>°</sup>
                </div>
                <div className="gauge-mode">Комфорт · поддерживаем</div>
              </div>
              <div className="gauge-poles">
                <span className="cool">◂ охлаждение</span>
                <span className="warm">обогрев ▸</span>
              </div>
              <div className="instrument-rows">
                <div className="instrument-row">
                  <span>Опыт</span>
                  <b>7 лет</b>
                </div>
                <div className="instrument-row">
                  <span>Гарантия на монтаж</span>
                  <b>1,5 года</b>
                </div>
                <div className="instrument-row">
                  <span>Выезд по МО</span>
                  <b>без выходных</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- УСЛУГИ ---------- */}
      <section id="services" className="section services">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">
              Всё для климата — <span className="em">от подбора до сервиса</span>
            </h2>
            <p className="section-lead">
              Продажа, монтаж и обслуживание кондиционеров в Москве и Московской области. Берём проект целиком и
              отвечаем за результат.
            </p>
          </div>
          <div className="services-panel" data-reveal>
            <div className="services-grid">
              {services.map((s) => (
                <article key={s.title} className="service-row">
                  <span className="service-ic">{icons[s.ic]}</span>
                  <div className="service-main">
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                    <button type="button" className="btn-link" onClick={openContact}>
                      Заказать
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ПОЛОСА-ДОКАЗАТЕЛЬСТВО ---------- */}
      <section className="section proof on-blue">
        <div className="container">
          <div data-reveal>
            <h2 className="proof-title">
              <span className="big">7 лет</span> держим климат под контролем в Москве и области
            </h2>
            <p className="proof-lead">
              Надёжные решения для комфортной температуры дома и в офисе — современное оборудование, чистый монтаж и
              честный сервис. Работаем во всех районах МО.
            </p>
          </div>
          <div className="proof-readouts" data-reveal>
            <div className="proof-readout">
              <span className="rk">Гарантия на монтаж</span>
              <span className="rv">1,5 года</span>
            </div>
            <div className="proof-readout">
              <span className="rk">Рейтинг на Авито</span>
              <span className="rv">5.0 / 20 отзывов</span>
            </div>
            <div className="proof-readout">
              <span className="rk">Качество работ</span>
              <span className="rv">100%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ПРЕИМУЩЕСТВА ---------- */}
      <section id="advantages" className="section advantages">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">
              Почему выбирают <span className="em">Lion Climate</span>
            </h2>
          </div>
          <div className="advantages-grid" data-reveal>
            {advantages.map((a) => (
              <div key={a.title} className="advantage-item">
                <span className="advantage-ic">{icons[a.ic]}</span>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ГАЛЕРЕЯ РАБОТ (реальные фото) ---------- */}
      <section id="gallery" className="section gallery">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">Галерея наших работ</h2>
            <p className="section-lead">
              Реальные объекты в Москве и области: аккуратные трассы, ровный монтаж блоков, чистая работа.
            </p>
          </div>
          <div className="gallery-grid" data-reveal>
            {galleryPhotos.map((f, i) => (
              <figure key={f} className={`gallery-item ${galleryMods[i]}`.trim()}>
                <img src={`/img/${f}`} alt="Пример установки кондиционера Lion Climate в Москве и МО" loading="lazy" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- БРЕНДЫ ---------- */}
      <section id="brands" className="section brands">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">
              Кондиционеры <span className="em">ведущих брендов</span>
            </h2>
            <p className="section-lead">
              Подберём модель под площадь, бюджет и задачу — от бытовых сплит-систем до мультизональных решений.
            </p>
          </div>
          <div className="brands-panel" data-reveal>
            <div className="brands-grid">
              {brands.map(([src, alt]) => (
                <div key={src} className="brand-item">
                  <img src={`/img/${src}`} alt={alt} loading="lazy" />
                </div>
              ))}
            </div>
            <div className="brands-cta">
              <p>
                <b>Розница и опт.</b> Расскажем про модели, посчитаем комплект и запишем на монтаж.
              </p>
              <button type="button" className="btn-primary" onClick={openContact}>
                Узнать цены
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- ОТЗЫВЫ ---------- */}
      <section id="reviews" className="section reviews">
        <div className="container">
          <div className="reviews-header" data-reveal>
            <div className="reviews-rating">
              <div className="rating-value">5.0</div>
              <div>
                <div className="rating-stars">★★★★★</div>
                <div className="rating-count">20 отзывов на Авито</div>
              </div>
            </div>
            <a
              href="https://www.avito.ru/brands/d7b9843794b89224313870e073774ddd/all"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Все отзывы на Авито
            </a>
          </div>
          <div className="reviews-grid" data-reveal>
            {reviews.map((r) => (
              <blockquote key={r.author + r.date} className="review-card">
                <div className="review-rating">★★★★★</div>
                <p className="review-text">{r.text}</p>
                <footer className="review-header">
                  <span className="review-author">{r.author}</span>
                  <span className="review-date">{r.date}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="section cta">
        <div className="container">
          <div data-reveal>
            <h2 className="cta-title">Обсудим ваш климат?</h2>
            <p className="cta-lead">
              Оставьте заявку — подберём кондиционер под площадь и бюджет, назовём точную цену и запишем на монтаж.
            </p>
            <div className="cta-actions">
              <button type="button" className="btn-primary btn-large" onClick={openContact}>
                Оставить заявку
              </button>
              <a href="tel:+79688234573" className="cta-phone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                +7 968 823 45 73
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- КОНТАКТЫ ---------- */}
      <section id="contacts" className="section contacts">
        <div className="container">
          <div className="section-head" data-reveal>
            <h2 className="section-title">Контакты</h2>
            <p className="section-lead">Установка и продажа кондиционеров по всей Москве и Московской области.</p>
          </div>
          <div className="contacts-panel" data-reveal>
            <div className="contacts-left">
              <div className="contact-line">
                <div className="contact-k">Телефон</div>
                <a href="tel:+79688234573" className="contact-phone-big">
                  +7 968 823 45 73
                </a>
              </div>
              <div className="contact-line">
                <div className="contact-k">Почта</div>
                <a href="mailto:lklimate@mail.ru" className="contact-v">
                  lklimate@mail.ru
                </a>
              </div>
              <div className="contact-line">
                <div className="contact-k">Зона работы</div>
                <span className="contact-v">Москва и Московская область, без выходных</span>
              </div>
            </div>
            <div className="contacts-right">
              <span className="mono-label" style={{ color: 'rgba(255,255,255,.7)' }}>
                Свяжитесь с нами
              </span>
              <h3>Ответим на вопросы и посчитаем стоимость под ключ</h3>
              <p>Перезвоним в ближайшее время и поможем подобрать решение.</p>
              <button type="button" className="btn-primary" onClick={openContact} style={{ alignSelf: 'flex-start' }}>
                Оставить заявку
              </button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
