#!/usr/bin/env bash
# Обновление Lion Climate на сервере: git pull → npm → сборка dist → перезапуск API.
#
# Использование:
#   sudo ./deploy/update.sh
#   sudo LIONCLIMATE_ROOT=/var/www/lionclimate.ru ./deploy/update.sh
#   ./deploy/update.sh --no-git          # без git pull
#   ./deploy/update.sh --no-restart      # без systemctl restart
#   ./deploy/update.sh --root /path/to/repo
#
# Переменные окружения:
#   LIONCLIMATE_ROOT  — корень репозитория (по умолчанию: родитель каталога deploy/)
#   SYSTEMD_UNIT      — юнит API (по умолчанию: lionclimate-api)
#   SKIP_GIT=1        — не выполнять git pull
#   SKIP_SYSTEMD=1    — не перезапускать сервис

set -euo pipefail

ROOT="${LIONCLIMATE_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-lionclimate-api}"
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
  echo "==> systemctl restart $SYSTEMD_UNIT"
  if command -v systemctl >/dev/null 2>&1; then
    systemctl restart "$SYSTEMD_UNIT"
    systemctl is-active --quiet "$SYSTEMD_UNIT" && echo "==> Сервис $SYSTEMD_UNIT: active" || {
      echo "Предупреждение: сервис не в состоянии active. Смотрите: journalctl -u $SYSTEMD_UNIT -n 40 --no-pager" >&2
    }
  else
    echo "systemctl не найден — перезапустите API вручную." >&2
  fi
else
  echo "==> Перезапуск сервиса пропущен (--no-restart / SKIP_SYSTEMD=1)"
fi

echo "==> Готово. Проверка: curl -sS http://127.0.0.1:3001/api/health"
