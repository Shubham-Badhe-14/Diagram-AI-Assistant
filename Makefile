.PHONY: dev-all dev-backend dev-frontend dev test install

# One terminal: venv + deps + backend + Vite (open http://localhost:5173)
dev-all:
	@chmod +x scripts/dev-all.sh 2>/dev/null || true
	@./scripts/dev-all.sh

install:
	@if [ ! -x venv/bin/python ]; then python3 -m venv venv; fi
	./venv/bin/pip install --upgrade pip
	./venv/bin/pip install -r backend/requirements.txt
	cd frontend && npm install

dev-backend:
	./venv/bin/uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && npm run dev

test:
	./venv/bin/python -m pytest tests -q --ignore=tests/integration_test.py
