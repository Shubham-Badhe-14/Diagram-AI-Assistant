#!/usr/bin/env bash
# One-shot dev: create/use project venv, install deps, run API + Vite.
# Open http://localhost:5173 (Vite proxies /api → http://127.0.0.1:8000).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VENV="$ROOT/venv"
PY="$VENV/bin/python"
PIP="$VENV/bin/pip"
UVICORN="$VENV/bin/uvicorn"

if [[ ! -x "$PY" ]]; then
  echo "==> Creating virtual environment at $VENV"
  python3 -m venv "$VENV"
fi

echo "==> Installing / upgrading Python dependencies"
"$PIP" install --upgrade pip
"$PIP" install -r "$ROOT/backend/requirements.txt"

echo "==> Installing frontend dependencies"
(cd "$ROOT/frontend" && npm install)

cleanup() {
  if [[ -n "${BACK_PID:-}" ]] && kill -0 "$BACK_PID" 2>/dev/null; then
    echo ""
    echo "==> Stopping backend (pid $BACK_PID)"
    kill "$BACK_PID" 2>/dev/null || true
    wait "$BACK_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "==> Starting FastAPI backend on http://127.0.0.1:8000"
"$UVICORN" backend.main:app --reload --host 0.0.0.0 --port 8000 &
BACK_PID=$!

echo "==> Waiting for backend /health ..."
ready=0
if command -v curl >/dev/null 2>&1; then
  for _ in $(seq 1 40); do
    if curl -sf "http://127.0.0.1:8000/health" >/dev/null; then
      ready=1
      break
    fi
    sleep 0.25
  done
else
  echo "    (curl not found; sleeping 3s for startup)"
  sleep 3
  ready=1
fi

if [[ "$ready" -ne 1 ]]; then
  echo "ERROR: Backend did not become ready. Check logs above." >&2
  exit 1
fi

echo ""
echo "==================================================================="
echo "  Frontend (open in browser):  http://localhost:5173"
echo "  API docs:                     http://127.0.0.1:8000/docs"
echo "  Health:                       http://127.0.0.1:8000/health"
echo ""
echo "  Press Ctrl+C to stop backend and Vite."
echo "==================================================================="
echo ""

cd "$ROOT/frontend"
exec npm run dev
