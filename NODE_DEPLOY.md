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

Готовый шаблон для копирования: [`deploy/lionclimate-api.service.example`](deploy/lionclimate-api.service.example).

**Важно:** первая строка файла юнита должна быть **`[Unit]`**. Если на строке 1 сразу `ExecStart=` или `EnvironmentFile=`, systemd выдаст `Assignment outside of section` и сервис не запустится.

Файл `/etc/systemd/system/lionclimate-api.service`:

```ini
[Unit]
Description=Lion Climate API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/lionclimate.ru/server
ExecStart=/usr/bin/node /var/www/lionclimate.ru/server/src/index.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Переменные (`JWT_SECRET`, `ADMIN_PASSWORD_HASH` и т.д.) приложение читает из **`server/.env`** само; строку **`EnvironmentFile=`** в unit лучше не добавлять — иначе bcrypt-хэш с символами `$` может исказиться.

Подставьте свой каталог вместо `/var/www/lionclimate.ru`, если он другой.

**Файл `.env` обязан существовать** по пути из `EnvironmentFile` (скопируйте `server/.env.example` → `server/.env` и заполните). Иначе: `Failed to load environment files`. Временно можно использовать `EnvironmentFile=-/path/.env` (минус = не считать ошибкой отсутствие файла), но для прод лучше создать `.env`.

**Вход в админку «неверный пароль» при bcrypt:** systemd при `EnvironmentFile=` может искажать строки с символом **`$`** (в хэше bcrypt их несколько). В коде включена загрузка `server/.env` с приоритетом над окружением systemd. Надёжный вариант — **убрать `EnvironmentFile=` из unit-файла** и оставить только `WorkingDirectory` + `ExecStart`: переменные тогда читает только Node из `server/.env`. Либо в unit вместо `EnvironmentFile` задать только безопасные переменные (`Environment=PORT=3001`).

**Админка всё равно не пускает — чеклист:**

1. `curl -s https://ВАШ_ДОМЕН/api/health` — в ответе должно быть `"adminAuthConfigured": true`. Если `false`, в `server/.env` нет ни `ADMIN_PASSWORD_HASH`, ни `ADMIN_PASSWORD`.
2. Хэш в `.env` — **одна строка**, без кавычек вокруг значения, без переноса строки посередине. Пример: `ADMIN_PASSWORD_HASH=$2b$10$...` (не `ADMIN_PASSWORD_HASH="$2b$10$..."` в nano, если кавычки попали в файл как часть значения — уберите).
3. Сгенерируйте хэш заново на сервере и вставьте в `.env` одной строкой:
   `cd /var/www/lionclimate.ru/server && node -p "require('bcrypt').hashSync('ВАШ_ПАРОЛЬ', 10)"`
4. После правок: `sudo systemctl restart lionclimate-api`. Смотрите логи: `journalctl -u lionclimate-api -n 30 --no-pager` — при ошибке bcrypt в логе будет подсказка.
5. Временно для проверки можно закомментировать `ADMIN_PASSWORD_HASH` и задать `ADMIN_PASSWORD=сложный_пароль` (только пока отлаживаете, потом верните хэш).

**Путь к `node`:** не обязательно `/usr/bin/node`. Узнайте: `which node` и подставьте полный путь в `ExecStart`.

Затем: `sudo systemctl daemon-reload && sudo systemctl enable --now lionclimate-api`.

#### Если `failed because of unavailable resources`

1. Логи сервиса (там будет реальная причина):

```bash
sudo systemctl status lionclimate-api.service --no-pager -l
sudo journalctl -xeu lionclimate-api.service -n 80 --no-pager
```

2. Запуск от того же пользователя, что в unit (часто `www-data`), вручную — увидите ошибку Node:

```bash
sudo -u www-data bash -c 'cd /var/www/lionclimate.ru/server && /usr/bin/node src/index.js'
```

Если `node` не в `/usr/bin`, замените на вывод `which node`.

3. Частые причины: неверный `ExecStart` (нет файла `index.js` или не тот путь к сайту); неверный путь к `node`; отсутствует `server/.env` (без `JWT_SECRET` приложение может упасть при старте); нет прав у `www-data` на каталог/файлы; порт `PORT` уже занят другим процессом.

### nginx

**Если `curl https://lionclimate.ru/api/health` отдаёт HTML с «404 Not Found» от nginx** — в конфиге **нет** прокси на Node для `/api/`, или блок попал не в тот `server { }` (другой виртуальный хост).

1. Убедитесь, что API запущен локально:
   ```bash
   curl -s http://127.0.0.1:3001/api/health
   ```
   Должен быть JSON вида `{"ok":true,"adminAuthConfigured":...}`. Если здесь ошибка — сначала `systemctl status lionclimate-api`.

2. В конфиге сайта **`server_name lionclimate.ru`** добавьте блоки из примера **[`deploy/nginx-lionclimate.example.conf`](deploy/nginx-lionclimate.example.conf)** (пути подставьте свои: `/var/www/lionclimate.ru`).

   **Если после правок всё ещё HTML 404 на `/api/health`:** проверьте, что в **активном** конфиге реально есть `location /api/`:
   ```bash
   sudo nginx -T 2>/dev/null | grep -n "location /api"
   curl -s http://127.0.0.1:3001/api/health
   ```
   Второй `curl` должен вернуть JSON — иначе чините `lionclimate-api`. Если JSON есть, а HTTPS — 404, nginx не подхватил правки (не тот файл, не тот `server { }`, нет `include`). Быстрый вариант — один раз подключить сниппет **[`deploy/snippets/lionclimate-node-api.conf`](deploy/snippets/lionclimate-node-api.conf)**:
   ```bash
   sudo cp /var/www/lionclimate.ru/deploy/snippets/lionclimate-node-api.conf /etc/nginx/snippets/
   # Внутри server { listen 443 ... server_name lionclimate.ru; } сразу после ssl_certificate / строк с add_header вставьте одну строку:
   # include /etc/nginx/snippets/lionclimate-node-api.conf;
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. Блок **`location /api/`** должен быть **внутри того же** `server { }`, что и SSL для вашего домена. Порядок: обычно сначала более специфичные `location` (`/api/`, `/img/`), затем общий `location /`.

4. Проверка и перезагрузка:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   curl -s https://lionclimate.ru/api/health
   ```

Проксирование API и статика SPA:

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
    root /var/www/lionclimate.ru/dist;
    try_files $uri $uri/ /index.html;
}

location /img/ {
    alias /var/www/lionclimate.ru/img/;
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

**Уязвимости в `tar` через `@mapbox/node-pre-gyp` (bcrypt):** в `server/package.json` задано поле **`overrides`** с `tar@^7.5.11`, чтобы все вложенные зависимости подтянули исправленную версию. После `git pull` выполните `cd server && rm -rf node_modules package-lock.json && npm install` и снова `npm audit`. Если сборка нативных модулей вдруг упадёт (редко), пришлите лог — тогда можно подобрать другой вариант (например, только `npm audit fix` без overrides).
