#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
# SecureCatch — Startup Script
# Starts the dev server and opens the app in your default browser.
# ─────────────────────────────────────────────

PORT=${PORT:-3000}
URL="http://localhost:$PORT"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DIR"

echo ""
echo "  SecureCatch SOAR Platform"
echo "─────────────────────────────────"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js v18+."
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js v18+ is required (found $(node -v))."
  exit 1
fi

# Check .env.local exists
if [ ! -f "$DIR/.env.local" ]; then
  echo "WARNING: .env.local not found."
  echo "         Copying from template — fill in your credentials before using."
  echo ""
  cat > "$DIR/.env.local" << 'ENVEOF'
# Jira Configuration
JIRA_HOST=yourorg.atlassian.net
JIRA_EMAIL=service-account@yourorg.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_SECOPS_PROJECT_KEY=SECOPS

# Google Workspace Configuration
GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SUBJECT_EMAIL=admin@yourorg.com
GOOGLE_ADMIN_EMAIL=admin@yourorg.com

# VirusTotal Configuration
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# OpenRouter Configuration
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Authentication (Future Use)
NEXTAUTH_SECRET=your-nextauth-secret

# Database
DATABASE_URL=file:./dev.db
ENVEOF
  echo "  Created .env.local — edit it with your credentials, then re-run this script."
  echo ""
fi

# Install dependencies if node_modules is missing
if [ ! -d "$DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Run Prisma migrations
echo "Checking database..."
npx prisma migrate deploy --schema="$DIR/prisma/schema.prisma" 2>/dev/null || true
echo ""

# Function to open browser after server is ready
open_browser() {
  local url="$1"
  # Wait for the server to respond
  echo "Waiting for server at $url ..."
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "$url" 2>/dev/null; then
      break
    fi
    sleep 1
  done

  # Open in default browser based on OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$url"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &>/dev/null; then
      xdg-open "$url"
    fi
  elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* ]]; then
    start "$url"
  fi
}

# Start browser opener in background
open_browser "$URL" &
BROWSER_PID=$!

echo "Starting SecureCatch on $URL"
echo "Press Ctrl+C to stop."
echo ""

# Cleanup on exit
cleanup() {
  kill "$BROWSER_PID" 2>/dev/null || true
  echo ""
  echo "SecureCatch stopped."
}
trap cleanup EXIT INT TERM

# Start the dev server (blocks until Ctrl+C)
node "$DIR/node_modules/next/dist/bin/next" dev --port "$PORT"
