# Инструкция по развертыванию сайта Lion Climate на VDS

## Подготовка

1. Подключитесь к VDS серверу по SSH
2. Убедитесь, что установлен веб-сервер (nginx или apache)

## Вариант 1: Nginx (рекомендуется)

### 1. Создание директории для сайта

```bash
# Перейдите в директорию с сайтами (обычно /var/www)
cd /var/www

# Создайте директорию для сайта
sudo mkdir -p skandata.ru
sudo chown -R www-data:www-data skandata.ru
# Или если используется другой пользователь:
# sudo chown -R $USER:$USER skandata.ru
```

### 2. Загрузка файлов на сервер

**Важно для админки и каталога:** на сервер должны попасть не только главная страница, но и папки:
- `admin/` — бэк-офис (вход, управление товарами)
- `api/` — API каталога
- `data/` — файл `products.json` (можно пустой `[]`)
- `img/products/` — папка для фото товаров

Иначе по адресу `https://ваш-сайт.ru/admin/index.php` будет 404.

Есть несколько способов загрузки:

#### Способ A: Через SCP (из локальной машины)
```bash
scp -r * user@your-server-ip:/var/www/skandata.ru/
```

#### Способ B: Через Git (если проект в репозитории)
```bash
cd /var/www/skandata.ru
sudo git clone https://your-repo-url.git .
```

#### Способ C: Через SFTP (FileZilla, WinSCP и т.д.)
Загрузите все файлы в директорию `/var/www/skandata.ru/`

### 3. Настройка Nginx

#### Создайте конфигурационный файл:

```bash
sudo nano /etc/nginx/sites-available/skandata.ru
```

#### Добавьте следующую конфигурацию:

```nginx
server {
    listen 80;
    server_name skandata.ru www.skandata.ru;
    # Для lionclimate.ru замените на: server_name lionclimate.ru www.lionclimate.ru;

    root /var/www/skandata.ru;
    # Для lionclimate.ru: root /var/www/lionclimate.ru;  (или путь, где лежит сайт)
    index index.html index.php;

    access_log /var/log/nginx/skandata.ru-access.log;
    error_log /var/log/nginx/skandata.ru-error.log;

    # Обработка PHP (обязательно для админки и каталога)
    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        # Или для версии PHP: fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 60;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

#### Активируйте сайт:

```bash
# Создайте символическую ссылку
sudo ln -s /etc/nginx/sites-available/skandata.ru /etc/nginx/sites-enabled/

# Проверьте конфигурацию
sudo nginx -t

# Перезагрузите nginx
sudo systemctl reload nginx
```

### 4. Настройка SSL (HTTPS) - рекомендуется

Установите Certbot для бесплатных SSL сертификатов Let's Encrypt:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d skandata.ru -d www.skandata.ru

# Certbot автоматически обновит конфигурацию nginx
```

### 5. Настройка DNS

В панели управления доменом добавьте A-запись:

```
Тип: A
Имя: @ (или skandata.ru)
Значение: IP-адрес вашего VDS сервера
TTL: 3600 (или автоматически)
```

Для поддомена www:
```
Тип: A
Имя: www
Значение: IP-адрес вашего VDS сервера
TTL: 3600
```

Или используйте CNAME:
```
Тип: CNAME
Имя: www
Значение: skandata.ru
TTL: 3600
```

## Вариант 2: Apache

### 1. Создание директории для сайта

```bash
sudo mkdir -p /var/www/skandata.ru
sudo chown -R www-data:www-data /var/www/skandata.ru
```

### 2. Загрузка файлов

Используйте тот же способ, что и для nginx.

### 3. Настройка Apache

#### Создайте конфигурационный файл:

```bash
sudo nano /etc/apache2/sites-available/skandata.ru.conf
```

#### Добавьте конфигурацию:

```apache
<VirtualHost *:80>
    ServerName skandata.ru
    ServerAlias www.skandata.ru
    DocumentRoot /var/www/skandata.ru

    <Directory /var/www/skandata.ru>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/skandata.ru-error.log
    CustomLog ${APACHE_LOG_DIR}/skandata.ru-access.log combined
</VirtualHost>
```

#### Активируйте сайт:

```bash
# Включите модули (если еще не включены)
sudo a2enmod rewrite
sudo a2enmod ssl

# Активируйте сайт
sudo a2ensite skandata.ru.conf

# Проверьте конфигурацию
sudo apache2ctl configtest

# Перезагрузите Apache
sudo systemctl reload apache2
```

### 4. Настройка SSL для Apache

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d skandata.ru -d www.skandata.ru
```

## Проверка прав доступа

Убедитесь, что файлы доступны для чтения:

```bash
sudo chmod -R 755 /var/www/skandata.ru
sudo chown -R www-data:www-data /var/www/skandata.ru
```

## Проверка работы сайта

1. Откройте в браузере: `http://skandata.ru`
2. Проверьте, что все ресурсы загружаются (изображения, CSS, JS)
3. После настройки SSL проверьте: `https://skandata.ru`

## Важные замечания

### Настройка Telegram бота

После размещения сайта нужно настроить Telegram интеграцию:

1. Откройте файл `script.js` на сервере
2. Настройте переменные:
   ```javascript
   const TELEGRAM_BOT_TOKEN = 'ваш_токен_бота';
   const TELEGRAM_CHAT_ID = 'ваш_chat_id';
   ```

**ВАЖНО**: Если сайт работает по HTTPS, формы будут работать. Для работы с HTTP может потребоваться настройка CORS или использование прокси-сервера для отправки в Telegram.

### Альтернативный способ отправки форм (через PHP)

Если прямой запрос к Telegram API не работает (из-за CORS), можно создать PHP-скрипт для обработки форм:

Создайте файл `send-telegram.php`:

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$TELEGRAM_BOT_TOKEN = 'ваш_токен_бота';
$TELEGRAM_CHAT_ID = 'ваш_chat_id';

$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'] ?? '';
$phone = $data['phone'] ?? '';
$service = $data['service'] ?? '';
$message = $data['message'] ?? '';
$formType = $data['formType'] ?? 'contact';

$telegramMessage = '';
if ($formType === 'contact') {
    $telegramMessage = "🔔 <b>Новая заявка на установку кондиционера</b>\n\n";
    $telegramMessage .= "👤 <b>Имя:</b> {$name}\n";
    $telegramMessage .= "📞 <b>Телефон:</b> {$phone}\n";
    $telegramMessage .= "🛠️ <b>Услуга:</b> {$service}\n";
    $telegramMessage .= "💬 <b>Сообщение:</b> {$message}\n";
} else {
    $telegramMessage = "💡 <b>Запрос на бесплатную консультацию</b>\n\n";
    $telegramMessage .= "👤 <b>Имя:</b> {$name}\n";
    $telegramMessage .= "📞 <b>Телефон:</b> {$phone}\n";
    $telegramMessage .= "💬 <b>Вопрос:</b> {$message}\n";
}

$telegramMessage .= "\n✅ <i>Согласие на обработку персональных данных получено</i>";

$url = "https://api.telegram.org/bot{$TELEGRAM_BOT_TOKEN}/sendMessage";

$postData = [
    'chat_id' => $TELEGRAM_CHAT_ID,
    'text' => $telegramMessage,
    'parse_mode' => 'HTML'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
curl_close($ch);

echo json_encode(['success' => true]);
?>
```

И обновите `script.js`, чтобы отправлять запросы на этот PHP-скрипт вместо прямого обращения к Telegram API.

## Устранение неполадок

### Ошибка 404 при открытии /admin/index.php (админка)

1. **Проверьте, что папки загружены на сервер.** По SSH:
   ```bash
   ls -la /var/www/ВАШ_САЙТ/admin/
   ls -la /var/www/ВАШ_САЙТ/api/
   ls -la /var/www/ВАШ_САЙТ/data/
   ```
   Должны быть файлы `admin/index.php`, `admin/config.php`, `api/products.php`, `data/products.json`. Если папок нет — загрузите их (FTP, SFTP или SCP) из проекта на сервер.

2. **Nginx должен выполнять PHP.** В конфиге сайта должен быть блок:
   ```nginx
   location ~ \.php$ {
       try_files $uri =404;
       fastcgi_pass unix:/var/run/php/php-fpm.sock;
       fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
       include fastcgi_params;
   }
   ```
   После правок: `sudo nginx -t` и `sudo systemctl reload nginx`.

3. **Должен быть установлен PHP-FPM:**
   ```bash
   sudo apt install php-fpm php-json php-mbstring
   sudo systemctl status php*-fpm
   ```
   В `location ~ \.php$` укажите свой сокет: `ls /var/run/php/`.

4. **Права на запись** для папок `data/` и `img/products/` (чтобы админка могла сохранять товары):
   ```bash
   sudo chown -R www-data:www-data /var/www/ВАШ_САЙТ/data
   sudo chown -R www-data:www-data /var/www/ВАШ_САЙТ/img/products
   chmod 755 /var/www/ВАШ_САЙТ/data /var/www/ВАШ_САЙТ/img/products
   ```

### Проверка логов nginx:
```bash
sudo tail -f /var/log/nginx/skandata.ru-error.log
```

### Проверка логов apache:
```bash
sudo tail -f /var/log/apache2/skandata.ru-error.log
```

### Синхронизация цен с поставщиками (раз в сутки)

Чтобы цены товаров автоматически подтягивались с сайта поставщика, настройте cron. Подробно: см. файл **admin/CRON_SYNC.md**. Кратко:

```bash
crontab -e
# Добавить строку (подставить свой CRON_SECRET_KEY из admin/config.php):
0 3 * * * curl -s "https://lionclimate.ru/admin/sync-prices.php?key=ВАШ_СЕКРЕТНЫЙ_КЛЮЧ"
```

### Проверка прав доступа:
```bash
ls -la /var/www/skandata.ru
```

### Проверка работы веб-сервера:
```bash
# Для nginx
sudo systemctl status nginx

# Для apache
sudo systemctl status apache2
```

