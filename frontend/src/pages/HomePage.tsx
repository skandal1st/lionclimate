import { useEffect, useState } from 'react';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import { useContactModals } from '../context/ContactModalContext';

export default function HomePage() {
  const { openContact, openConsult } = useContactModals();
  const [cookieBanner, setCookieBanner] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookieConsent')) {
      const t = setTimeout(() => setCookieBanner(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <>
      {cookieBanner && (
        <div id="cookieBanner" className="cookie-banner show">
          <div className="cookie-content">
            <p>
              Мы используем файлы cookie для улучшения работы сайта. Продолжая использовать сайт, вы соглашаетесь с{' '}
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

      <section className="hero">
        <div className="hero-background">
          <img
            src="/img/air-9023085_1920.jpg"
            alt="Профессиональная установка кондиционеров в Москве и Московской области - Lion Climate"
            loading="eager"
          />
        </div>
        <div className="container">
          <div className="hero-content">
            <h2 className="hero-title">
              <span className="hero-title-line">Розничная и оптовая продажа</span>
              <span className="hero-title-line hero-title-accent">кондиционеров</span>
              <span className="hero-title-line">с профессиональной установкой в Москве и МО.</span>
            </h2>
            <p className="hero-description">
              Широкий ассортимент кондиционеров ведущих брендов в Москве и Московской области. Розничная и оптовая продажа,
              профессиональная установка и обслуживание с гарантией качества 1.5 года. Работаем во всех районах МО.
            </p>
            <div className="hero-buttons">
              <button type="button" className="btn-primary btn-large" onClick={openContact}>
                Купить кондиционер
              </button>
              <button type="button" className="btn-secondary btn-large" onClick={openConsult}>
                Узнать цены
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="services">
        <div className="container">
          <h2 className="section-title">Услуги по продаже и установке кондиционеров в Москве и МО</h2>
          <div className="services-grid">
            {[
              {
                img: '/img/air-conditioner-svgrepo-com.svg',
                title: 'Продажа кондиционеров в Москве и МО',
                text: 'Розничная и оптовая продажа кондиционеров ведущих мировых брендов с доставкой и установкой по всей Московской области',
              },
              {
                img: '/img/air-conditioner-svgrepo-com.svg',
                title: 'Установка кондиционера в Москве',
                text: 'Профессиональный монтаж кондиционеров любой сложности с гарантией качества в Москве и Московской области',
              },
              {
                img: '/img/air-conditioner-air-conditioning-svgrepo-com.svg',
                title: 'Монтаж кондиционера в МО',
                text: 'Быстрый и качественный монтаж кондиционеров в Московской области с использованием профессионального оборудования',
              },
              {
                img: '/img/air-conditioner-outdoor-svgrepo-com.svg',
                title: 'Чистка кондиционеров в Москве',
                text: 'Профессиональная чистка кондиционеров в Москве и МО без грязи и пыли, с использованием специального оборудования',
              },
              {
                img: '/img/gas-svgrepo-com.svg',
                title: 'Заправка фреоном в МО',
                text: 'Профессиональная заправка кондиционеров фреоном в Московской области с проверкой системы',
              },
            ].map((s) => (
              <div key={s.title} className="service-card">
                <div className="service-icon">
                  <img src={s.img} alt="" />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <button type="button" className="btn-link" onClick={openContact}>
                  Заказать
                </button>
              </div>
            ))}
            <div className="service-card">
              <div className="service-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h3>Обслуживание кондиционеров в Москве</h3>
              <p>Комплексное обслуживание и профилактика кондиционеров в Москве и МО для поддержания работы системы</p>
              <button type="button" className="btn-link" onClick={openContact}>
                Заказать
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-content">
            <div className="stats-main">
              <h2 className="stats-title">
                <span className="stats-number">7</span> лет опыта в установке
                <span className="stats-accent">кондиционеров</span> и профессиональном монтаже.
              </h2>
              <p className="stats-description">
                Надёжные решения для комфортного климата в Москве и Московской области с использованием современного оборудования и
                профессионального подхода. Обслуживаем все районы МО.
              </p>
            </div>
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-value">1.5</div>
                <div className="stat-label">года гарантии</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">100%</div>
                <div className="stat-label">качество работы</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="advantages" className="advantages">
        <div className="container">
          <h2 className="section-title">
            <span className="section-title-accent">Почему выбирают</span> Lion Climate
          </h2>
          <div className="advantages-grid">
            {[
              { img: '/img/fast-delivery-truck-van-svgrepo-com.svg', title: 'Быстрый выезд', text: 'В удобное для вас время, без выходных и задержек' },
              { img: '/img/clean-svgrepo-com.svg', title: 'Аккуратность и чистота', text: 'После работы убираем пыль и грязь с помощью профессионального пылесоса' },
            ].map((a) => (
              <div key={a.title} className="advantage-item">
                <div className="advantage-icon">
                  <img src={a.img} alt="" />
                </div>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
              </div>
            ))}
            <div className="advantage-item">
              <div className="advantage-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h3>Гарантия на монтаж — 1,5 года!</h3>
              <p>Уверенность в качестве и надёжности</p>
            </div>
          </div>
        </div>
      </section>

      <section id="gallery" className="gallery">
        <div className="container">
          <h2 className="section-title">Галерея работ по установке кондиционеров в Москве и МО</h2>
          <div className="gallery-grid">
            {[
              'photo_2026-01-16_10-16-39.jpg',
              'photo_2026-01-16_10-16-38.jpg',
              'photo_2026-01-16_10-16-31.jpg',
              'photo_2026-01-16_10-16-30.jpg',
              'photo_2026-01-16_10-16-45.jpg',
              'photo_2026-01-16_10-16-43.jpg',
              'photo_2026-01-16_10-16-41.jpg',
              'photo_2026-01-15_23-20-32.jpg',
              'photo_2026-01-15_23-18-20.jpg',
            ].map((f) => (
              <div key={f} className="gallery-item">
                <img src={`/img/${f}`} alt="" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="brands" className="brands">
        <div className="container">
          <h2 className="section-title">
            <span className="section-title-accent">Розничная и оптовая продажа</span> кондиционеров в Москве и МО
          </h2>
          <p className="brands-description">
            Предлагаем широкий ассортимент кондиционеров от ведущих мировых производителей в Москве и Московской области.
          </p>
          <div className="brands-grid">
            {[
              ['Бренды/png-clipart-daikin-applied-americas-business-air-conditioning-heat-pump-business-blue-text.png', 'Daikin'],
              ['Бренды/png-transparent-hitachi-hd-logo-thumbnail.png', 'Hitachi'],
              ['Бренды/Samsung_old_logo_before_year_2015.svg.png', 'Samsung'],
              ['Бренды/7011.T-527f6e23.png', 'MDV'],
            ].map(([src, alt]) => (
              <div key={src} className="brand-item">
                <img src={`/img/${src}`} alt={alt} loading="lazy" />
              </div>
            ))}
          </div>
          <div className="brands-info">
            <button type="button" className="btn-primary btn-large" onClick={openContact}>
              Узнать цены и купить
            </button>
          </div>
        </div>
      </section>

      <section id="reviews" className="reviews">
        <div className="container">
          <div className="reviews-header">
            <div className="reviews-rating">
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className="star">
                    ★
                  </span>
                ))}
              </div>
              <div className="rating-value">5.0</div>
              <div className="rating-count">20 отзывов</div>
            </div>
            <a
              href="https://www.avito.ru/brands/d7b9843794b89224313870e073774ddd/all"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Смотреть все отзывы на Авито
            </a>
          </div>
          <div className="reviews-grid">
            {[
              { author: 'Дмитрий', date: '25 октября 2025', text: 'Честный и порядочный человек Мастер своего дела, быстро, качественно и по хорошей цене' },
              { author: 'Тимофей Волков', date: '26 сентября 2025', text: 'Все четко, быстро сняли, всё рассказали и подсказали)' },
            ].map((r) => (
              <div key={r.author + r.date} className="review-card">
                <div className="review-header">
                  <div className="review-author">{r.author}</div>
                  <div className="review-date">{r.date}</div>
                </div>
                <div className="review-rating">★★★★★</div>
                <p className="review-text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-background">
          <img src="/img/air-conditioner-1185041_1920.jpg" alt="" loading="lazy" />
        </div>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              <span className="cta-title-line">Мы верим, что качественная установка начинается с</span>
              <span className="cta-title-line">понимания потребностей, технических требований и того, как</span>
              <span className="cta-title-line cta-title-accent">пространство поддерживает комфорт.</span>
            </h2>
            <button type="button" className="btn-primary btn-large" onClick={openContact}>
              Связаться
            </button>
          </div>
        </div>
      </section>

      <section id="contacts" className="contacts">
        <div className="contacts-background">
          <img src="/img/1000_F_173977879_rFzmiXZkRIYn8stWuA3DvI9VnOmD0aCh.jpg" alt="" loading="lazy" />
        </div>
        <div className="container">
          <h2 className="section-title">Контакты - установка кондиционеров в Москве и МО</h2>
          <div className="contacts-content">
            <div className="contact-info">
              <p>Работаем по всей Москве и Московской области.</p>
              <p className="contact-phone">
                <a href="tel:+79688234573" className="phone-link">
                  +7 968 823 45 73
                </a>
              </p>
              <p className="contact-email">
                <a href="mailto:lklimate@mail.ru" className="email-link">
                  lklimate@mail.ru
                </a>
              </p>
            </div>
            <button type="button" className="btn-primary btn-large" onClick={openContact}>
              Оставить заявку
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
