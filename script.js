// Конфигурация Telegram бота (замените на ваши данные)
const TELEGRAM_BOT_TOKEN = '5762581110:AAEmw4kTEl72NRzh4RadGOw-gWpjMas2n_M'; // Замените на токен вашего Telegram бота
const TELEGRAM_CHAT_ID = '433839797'; // Замените на ваш Chat ID

// Cookie плашка
document.addEventListener('DOMContentLoaded', function() {
    // Проверка согласия на cookie
    const cookieConsent = localStorage.getItem('cookieConsent');
    const cookieBanner = document.getElementById('cookieBanner');
    
    if (!cookieConsent) {
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000);
    }
    
    // Обработка принятия cookie
    const acceptCookiesBtn = document.getElementById('acceptCookies');
    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener('click', function() {
            localStorage.setItem('cookieConsent', 'true');
            cookieBanner.classList.remove('show');
            setTimeout(() => {
                cookieBanner.style.display = 'none';
            }, 400);
        });
    }
});

// Модальные окна
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    const modalOverlay = document.getElementById('modalOverlay');
    
    // Открытие модального окна
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('show');
                modalOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Закрытие модального окна
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    // Закрытие при клике на overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function() {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
        });
    }
    
    // Закрытие при нажатии ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
        }
    });
    
    function closeModal(modal) {
        modal.classList.remove('show');
        modalOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    // Мобильное меню
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Закрытие меню при клике на ссылку
    if (navMenu) {
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                if (mobileMenuToggle) {
                    mobileMenuToggle.classList.remove('active');
                }
            });
        });
    }
});

// Отправка формы в Telegram через PHP бэкенд
async function sendToTelegram(formData, formType) {
    const name = formData.get('name') || 'Не указано';
    const phone = formData.get('phone') || 'Не указано';
    const service = formData.get('service') || 'Не указано';
    const message = formData.get('message') || 'Не указано';
    
    // Используем PHP скрипт для отправки (обходит CORS и хранит токены на сервере)
    const url = 'send-telegram.php';
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                service: service,
                message: message,
                formType: formType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return true;
        } else {
            console.error('Ошибка отправки в Telegram:', data);
            // Если PHP скрипт не настроен, пробуем прямой запрос (для тестирования)
            return await sendToTelegramDirect(formData, formType);
        }
    } catch (error) {
        console.error('Ошибка при отправке формы:', error);
        // Если PHP скрипт недоступен, пробуем прямой запрос
        return await sendToTelegramDirect(formData, formType);
    }
}

// Прямая отправка в Telegram (резервный вариант, работает только с настроенными токенами)
async function sendToTelegramDirect(formData, formType) {
    const botToken = TELEGRAM_BOT_TOKEN;
    const chatId = TELEGRAM_CHAT_ID;
    
    if (!botToken || botToken === 'YOUR_BOT_TOKEN' || !chatId || chatId === 'YOUR_CHAT_ID') {
        console.error('Пожалуйста, настройте send-telegram.php или укажите TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в script.js');
        alert('Ошибка: не настроена интеграция с Telegram. Пожалуйста, свяжитесь с администратором.');
        return false;
    }
    
    const name = formData.get('name') || 'Не указано';
    const phone = formData.get('phone') || 'Не указано';
    const service = formData.get('service') || 'Не указано';
    const message = formData.get('message') || 'Не указано';
    
    let telegramMessage = '';
    
    if (formType === 'contact') {
        telegramMessage = `🔔 <b>Новая заявка на установку кондиционера</b>\n\n`;
        telegramMessage += `👤 <b>Имя:</b> ${name}\n`;
        telegramMessage += `📞 <b>Телефон:</b> ${phone}\n`;
        telegramMessage += `🛠️ <b>Услуга:</b> ${service}\n`;
        telegramMessage += `💬 <b>Сообщение:</b> ${message}\n`;
    } else if (formType === 'consultation') {
        telegramMessage = `💡 <b>Запрос на бесплатную консультацию</b>\n\n`;
        telegramMessage += `👤 <b>Имя:</b> ${name}\n`;
        telegramMessage += `📞 <b>Телефон:</b> ${phone}\n`;
        telegramMessage += `💬 <b>Вопрос:</b> ${message}\n`;
    }
    
    telegramMessage += `\n✅ <i>Согласие на обработку персональных данных получено</i>`;
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: telegramMessage,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            return true;
        } else {
            console.error('Ошибка отправки в Telegram:', data);
            return false;
        }
    } catch (error) {
        console.error('Ошибка при отправке формы:', error);
        return false;
    }
}

// Обработка контактной формы
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            
            const formData = new FormData(this);
            
            // Валидация
            const name = formData.get('name');
            const phone = formData.get('phone');
            const consent = formData.get('consent');
            
            if (!name || !phone) {
                alert('Пожалуйста, заполните все обязательные поля');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            if (!consent) {
                alert('Необходимо согласие на обработку персональных данных');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Отправка в Telegram
            const success = await sendToTelegram(formData, 'contact');
            
            if (success) {
                alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
                contactForm.reset();
                
                // Закрытие модального окна
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    document.getElementById('modalOverlay').classList.remove('show');
                    document.body.style.overflow = '';
                }
            } else {
                alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    }
    
    // Обработка формы консультации
    const consultationForm = document.getElementById('consultationForm');
    
    if (consultationForm) {
        consultationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Отправка...';
            
            const formData = new FormData(this);
            
            // Валидация
            const name = formData.get('name');
            const phone = formData.get('phone');
            const consent = formData.get('consent');
            
            if (!name || !phone) {
                alert('Пожалуйста, заполните все обязательные поля');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            if (!consent) {
                alert('Необходимо согласие на обработку персональных данных');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
            
            // Отправка в Telegram
            const success = await sendToTelegram(formData, 'consultation');
            
            if (success) {
                alert('Спасибо! Ваш запрос отправлен. Мы свяжемся с вами в ближайшее время.');
                consultationForm.reset();
                
                // Закрытие модального окна
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    document.getElementById('modalOverlay').classList.remove('show');
                    document.body.style.overflow = '';
                }
            } else {
                alert('Произошла ошибка при отправке запроса. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
            }
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
    }
});

// Маска для телефона
document.addEventListener('DOMContentLoaded', function() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            
            if (value.length > 0) {
                let formattedValue = '+7';
                
                if (value.length > 1) {
                    formattedValue += ' (' + value.slice(1, 4);
                }
                if (value.length >= 4) {
                    formattedValue += ') ' + value.slice(4, 7);
                }
                if (value.length >= 7) {
                    formattedValue += '-' + value.slice(7, 9);
                }
                if (value.length >= 9) {
                    formattedValue += '-' + value.slice(9, 11);
                }
                
                e.target.value = formattedValue;
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && e.target.value === '+7 ') {
                e.target.value = '';
            }
        });
    });
});

// Плавная прокрутка
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Анимация при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .advantage-item, .gallery-item');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});



