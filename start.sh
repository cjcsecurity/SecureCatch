#!/usr/bin/env bash
set -euo pipefail

PORT=${PORT:-3000}
APP_URL="http://localhost:$PORT"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$APP_DIR"

echo "SecureCatch"
echo "Starting local development environment"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 20 or newer is required."
  exit 1
fi

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node.js 20 or newer is required (found $(node -v))."
  exit 1
fi

if [ ! -f "$APP_DIR/.env.local" ]; then
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env.local"
  echo "Created .env.local from the template. Configure it, then run ./start.sh again."
  exit 1
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "Installing locked dependencies..."
  npm ci
fi

echo "Applying database migrations..."
npm run db:migrate

open_browser() {
  local target_url="$1"
  for _ in $(seq 1 30); do
    if curl --fail --silent --output /dev/null "$target_url" 2>/dev/null; then
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$target_url"
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$target_url"
      fi
      return
    fi
    sleep 1
  done
}

open_browser "$APP_URL" &
BROWSER_PID=$!
cleanup() {
  kill "$BROWSER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Opening $APP_URL"
node "$APP_DIR/node_modules/next/dist/bin/next" dev --port "$PORT"
