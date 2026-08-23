import { useEffect, useState } from 'react';
import { submitLead } from '../api';

type Props = {
  contactOpen: boolean;
  consultOpen: boolean;
  onClose: () => void;
};

export default function SiteContactModals({ contactOpen, consultOpen, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (contactOpen || consultOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [contactOpen, consultOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (contactOpen || consultOpen) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [contactOpen, consultOpen, onClose]);

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const consent = fd.get('consent');
    if (!name || !phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    if (!consent) {
      alert('Необходимо согласие на обработку персональных данных');
      return;
    }
    setSubmitting(true);
    try {
      await submitLead({
        name,
        phone,
        service: String(fd.get('service') || ''),
        message: String(fd.get('message') || ''),
        formType: 'contact',
      });
      alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
      form.reset();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConsultSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    const consent = fd.get('consent');
    if (!name || !phone) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    if (!consent) {
      alert('Необходимо согласие на обработку персональных данных');
      return;
    }
    setSubmitting(true);
    try {
      await submitLead({
        name,
        phone,
        message: String(fd.get('message') || ''),
        formType: 'consultation',
      });
      alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
      form.reset();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div id="contactModal" className={`modal${contactOpen ? ' show' : ''}`}>
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Закрыть" onClick={onClose}>
            &times;
          </button>
          <h2>Оставить заявку</h2>
          <p className="modal-sub">Перезвоним в ближайшее время, подберём кондиционер и назовём точную цену.</p>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="site-contact-name">Ваше имя *</label>
              <input type="text" id="site-contact-name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="site-contact-phone">Телефон *</label>
              <input type="tel" id="site-contact-phone" name="phone" required placeholder="+7 (999) 123-45-67" />
            </div>
            <div className="form-group">
              <label htmlFor="site-contact-service">Услуга</label>
              <select id="site-contact-service" name="service" defaultValue="">
                <option value="">Выберите услугу</option>
                <option value="Продажа кондиционеров (розница)">Продажа кондиционеров (розница)</option>
                <option value="Продажа кондиционеров (опт)">Продажа кондиционеров (опт)</option>
                <option value="Установка кондиционера">Установка кондиционера</option>
                <option value="Монтаж кондиционера">Монтаж кондиционера</option>
                <option value="Чистка кондиционеров">Чистка кондиционеров</option>
                <option value="Заправка фреоном">Заправка фреоном</option>
                <option value="Обслуживание кондиционеров">Обслуживание кондиционеров</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="site-contact-message">Сообщение</label>
              <textarea id="site-contact-message" name="message" rows={4} />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" id="site-contact-consent" name="consent" required />
                <span>Я согласен на обработку персональных данных *</span>
              </label>
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </form>
        </div>
      </div>

      <div id="consultationModal" className={`modal${consultOpen ? ' show' : ''}`}>
        <div className="modal-content">
          <button type="button" className="modal-close" aria-label="Закрыть" onClick={onClose}>
            &times;
          </button>
          <h2>Рассчитать стоимость</h2>
          <p className="modal-sub">Оставьте контакты — поможем с выбором и посчитаем монтаж под ключ.</p>
          <form className="contact-form" onSubmit={handleConsultSubmit}>
            <div className="form-group">
              <label htmlFor="site-consult-name">Ваше имя *</label>
              <input type="text" id="site-consult-name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="site-consult-phone">Телефон *</label>
              <input type="tel" id="site-consult-phone" name="phone" required placeholder="+7 (999) 123-45-67" />
            </div>
            <div className="form-group">
              <label htmlFor="site-consult-message">Ваш вопрос</label>
              <textarea id="site-consult-message" name="message" rows={4} placeholder="Опишите ваш вопрос или задачу" />
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" id="site-consult-consent" name="consent" required />
                <span>Я согласен на обработку персональных данных *</span>
              </label>
            </div>
            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Отправка...' : 'Заказать консультацию'}
            </button>
          </form>
        </div>
      </div>

      <div
        id="modalOverlay"
        className={`modal-overlay${contactOpen || consultOpen ? ' show' : ''}`}
        onClick={onClose}
        role="presentation"
      />
    </>
  );
}
