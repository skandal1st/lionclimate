# Развёртывание: Node API + React (SPA)

## Сборка фронтенда

```bash
cd frontend && npm install && npm run build
```

Статика попадает в каталог [`dist/`](dist/) в корне репозитория (рядом с `img/`, `data/`).

## API (Node.js)

```bash
cd server && npm install
cp .env.example .env
# Заполните JWT_SECRET, ADMIN_PASSWORD или ADMIN_PASSWORD_HASH, при необходимости TELEGRAM_*
npm start
```

По умолчанию слушает порт **3001** (переменная `PORT`).

Переменные путей по умолчанию указывают на [`data/products.json`](data/products.json) и [`img/products/`](img/products/) относительно корня проекта — запускайте процесс с **рабочей директорией** корня репозитория или задайте абсолютные пути в `.env`.

### systemd (пример)

Файл `/etc/systemd/system/lionclimate-api.service`:

```ini
[Unit]
Description=Lion Climate API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lionclimate
EnvironmentFile=/var/www/lionclimate/server/.env
ExecStart=/usr/bin/node /var/www/lionclimate/server/src/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Затем: `sudo systemctl daemon-reload && sudo systemctl enable --now lionclimate-api`.

### nginx

Проксирование API на Node и отдача статики SPA + `try_files` для React Router:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location / {
    root /var/www/lionclimate/dist;
    try_files $uri $uri/ /index.html;
}

location /img/ {
    alias /var/www/lionclimate/img/;
}
```

Сборка копирует изображения в `dist/img/` при `npm run build`; если используете только общий каталог `img/` у корня сайта, блок `alias` для `/img/` достаточен без дублирования в `dist`.

## Устаревшие PHP-эндпоинты

После перехода на Node + React:

- [`send-telegram.php`](send-telegram.php) — заявки обрабатываются через `POST /api/leads` на Node; PHP-скрипт можно удалить с сервера.
- Старый каталог [`admin/`](admin/) (PHP) заменён React-админкой по путям `/admin/*`. PHP-блок в nginx для старой админки можно отключить.

## Безопасность

- Сгенерируйте сильный `JWT_SECRET` и храните пароль админки как bcrypt (`ADMIN_PASSWORD_HASH`), не коммитьте `.env`.
- Ротируйте токен Telegram, если он ранее попадал в репозиторий.

### npm: предупреждения и `npm audit`

После `npm install` часто появляются **deprecated** для транзитивных пакетов (`glob`, `rimraf`, `tar`, `gauge` и т.д.) — их тянут нативные модули вроде **bcrypt** и **better-sqlite3**. Это не ошибка установки: пока нет обновления у этих пакетов, предупреждения можно игнорировать.

Сообщение **«2 high severity vulnerabilities»** чаще всего было связано со **старым Multer 1.x** (исправлено в зависимостях проекта: `multer@^2`). На сервере после `git pull` выполните:

```bash
cd server && rm -rf node_modules package-lock.json && npm install
npm audit
```

При необходимости: `npm audit fix` (без `--force`, если не уверены в breaking changes). Если что-то останется — смотрите детали: `npm audit --json` или отчёт по конкретному пакету; часть уязвимостей может относиться только к **devDependencies** или к инструментам сборки, не к рантайму API.
