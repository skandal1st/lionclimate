#!/usr/bin/env bash
# Обновление Lion Climate на сервере: git pull → npm → сборка dist → перезапуск API.
#
# Если «обновился только git», а сервис не перезапустился:
#   • упал npm install / npm run build — скрипт останавливается ДО systemctl (смотрите вывод выше);
#   • в PATH не было systemctl (редко в cron) — теперь скрипт завершится с ошибкой;
#   • передан --no-restart или SKIP_SYSTEMD=1;
#   • запуск без sudo: теперь вызывается sudo systemctl (нужен пароль или NOPASSWD).
#
# Использование:
#   sudo ./deploy/update.sh
#   sudo LIONCLIMATE_ROOT=/var/www/lionclimate.ru ./deploy/update.sh
#   ./deploy/update.sh --no-git          # без git pull
#   ./deploy/update.sh --no-restart      # без systemctl restart
#   RELOAD_NGINX=1 sudo ./deploy/update.sh   # дополнительно reload nginx
#   ./deploy/update.sh --root /path/to/repo
#
# Переменные окружения:
#   LIONCLIMATE_ROOT  — корень репозитория (по умолчанию: родитель каталога deploy/)
#   SYSTEMD_UNIT      — юнит API (по умолчанию: lionclimate-api)
#   RELOAD_NGINX=1    — после API выполнить nginx -t && systemctl reload nginx
#   SKIP_GIT=1        — не выполнять git pull
#   SKIP_SYSTEMD=1    — не перезапускать сервис

set -euo pipefail

ROOT="${LIONCLIMATE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-lionclimate-api}"
# Опционально: reload nginx после деплоя (например смена конфига в sites-enabled)
RELOAD_NGINX="${RELOAD_NGINX:-0}"
SKIP_GIT="${SKIP_GIT:-0}"
SKIP_SYSTEMD="${SKIP_SYSTEMD:-0}"

usage() {
  cat <<'EOF'
Обновление: git pull → npm (server, frontend) → vite build → systemctl restart API

  ./deploy/update.sh [опции]

Опции:
  --no-git       не выполнять git pull
  --no-restart   не вызывать systemctl restart
  --root ПУТЬ    корень репозитория (иначе LIONCLIMATE_ROOT или каталог выше deploy/)

Переменные: LIONCLIMATE_ROOT, SYSTEMD_UNIT (по умолчанию lionclimate-api),
            SKIP_GIT=1, SKIP_SYSTEMD=1

Пример на сервере:
  cd /var/www/lionclimate.ru && sudo ./deploy/update.sh
EOF
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-git) SKIP_GIT=1; shift ;;
    --no-restart) SKIP_SYSTEMD=1; shift ;;
    --root)
      ROOT="${2:?укажите путь после --root}"
      shift 2
      ;;
    -h | --help) usage 0 ;;
    *)
      echo "Неизвестный аргумент: $1 (см. $0 --help)" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$ROOT/server" || ! -d "$ROOT/frontend" ]]; then
  echo "Ошибка: в $ROOT нет server/ или frontend/ — проверьте LIONCLIMATE_ROOT / --root" >&2
  exit 1
fi

echo "==> Корень проекта: $ROOT"

if [[ "$SKIP_GIT" != "1" ]]; then
  echo "==> git pull --ff-only"
  git -C "$ROOT" pull --ff-only
else
  echo "==> git pull пропущен (SKIP_GIT / --no-git)"
fi

echo "==> server: npm install"
(
  cd "$ROOT/server"
  npm install --no-audit --no-fund
)

echo "==> frontend: npm install && npm run build"
(
  cd "$ROOT/frontend"
  npm install --no-audit --no-fund
  npm run build
)

if [[ "$SKIP_SYSTEMD" != "1" ]]; then
  echo "==> Перезапуск $SYSTEMD_UNIT"
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "Ошибка: systemctl не найден в PATH (часто так в cron: задайте PATH или используйте полный путь)." >&2
    echo "         Либо выполните: $0 --no-restart  и перезапустите API вручную." >&2
    exit 1
  fi

  # Без root обычно нужен sudo (интерактивный пароль или NOPASSWD в sudoers)
  if [[ "${EUID:-0}" -eq 0 ]]; then
    systemctl restart "$SYSTEMD_UNIT"
  else
    echo "    (не root — через sudo systemctl)"
    sudo systemctl restart "$SYSTEMD_UNIT"
  fi

  if [[ "${EUID:-0}" -eq 0 ]]; then
    _active=(systemctl is-active --quiet "$SYSTEMD_UNIT")
  else
    _active=(sudo systemctl is-active --quiet "$SYSTEMD_UNIT")
  fi
  if "${_active[@]}" 2>/dev/null; then
    echo "==> Сервис $SYSTEMD_UNIT: active"
  else
    echo "Предупреждение: сервис не в состоянии active. Смотрите: journalctl -u $SYSTEMD_UNIT -n 40 --no-pager" >&2
  fi

  if [[ "$RELOAD_NGINX" == "1" ]]; then
    echo "==> nginx: проверка и reload"
    if [[ "${EUID:-0}" -eq 0 ]]; then
      nginx -t && systemctl reload nginx
    else
      sudo nginx -t && sudo systemctl reload nginx
    fi
  fi
else
  echo "==> Перезапуск сервиса пропущен (--no-restart / SKIP_SYSTEMD=1)"
fi

echo "==> Готово. Проверка: curl -sS http://127.0.0.1:3001/api/health"
