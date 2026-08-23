import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="site-name">Lion Climate</span>
            <p>
              Продажа, установка и обслуживание кондиционеров в Москве и Московской области. Розница и опт, монтаж с
              гарантией 1,5 года.
            </p>
          </div>
          <div className="footer-col">
            <h4>Разделы</h4>
            <ul>
              <li>
                <Link to="/catalog">Каталог</Link>
              </li>
              <li>
                <a href="/#services">Услуги</a>
              </li>
              <li>
                <a href="/#gallery">Галерея работ</a>
              </li>
              <li>
                <a href="/#reviews">Отзывы</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Контакты</h4>
            <ul>
              <li>
                <a href="tel:+79688234573" className="footer-phone">
                  +7 968 823 45 73
                </a>
              </li>
              <li>
                <a href="mailto:lklimate@mail.ru">lklimate@mail.ru</a>
              </li>
              <li>Москва и МО, без выходных</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Lion Climate. Все права защищены.</span>
          <span>
            Создано в{' '}
            <a href="https://aximatech.ru/" target="_blank" rel="noopener noreferrer">
              AXIMA
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
