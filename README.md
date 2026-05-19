# Linkdin-comment

Chrome extension + FastAPI backend that assists with LinkedIn comments. Current scope is an **MVP**: the extension fills a test comment into LinkedIn's comment box. You click submit. No AI, no auto-submit, no extension↔backend wiring yet.

## Repo layout

```
.
├── frontend/
│   ├── extension/        # Vanilla-JS Manifest V3 Chrome extension
│   └── ...               # Next.js 16 app (separate concern, scaffolded)
└── backend/
    ├── app/              # FastAPI app + Supabase client
    └── requirements.txt
```

| Piece                                             | What it does                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [frontend/extension/](frontend/extension/)        | MV3 Chrome extension — detects LinkedIn login, scans feed posts, pre-fills a comment.   |
| [frontend/](frontend/)                            | Next.js 16 app (placeholder for the dashboard UI).                                      |
| [backend/](backend/)                              | FastAPI service with a Supabase Python client wired up.                                 |

## Quick start

### 1. Chrome extension

1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select [frontend/extension/](frontend/extension/).
2. Sign in at `https://www.linkedin.com/feed/`.
3. Open the extension popup → click **Post Test Comment** → review the pre-filled text → click LinkedIn's **Post** button yourself.

Detailed instructions and troubleshooting: [frontend/extension/README.md](frontend/extension/README.md).

### 2. Backend (FastAPI + Supabase)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
uvicorn app.main:app --reload
```

- `GET /health` — basic health probe
- `GET /supabase/ping` — smoke-tests Supabase by reading the `todos` table

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## What this MVP does NOT do

- No AI comment generation
- No auto-submission of comments
- No network calls from the extension to the backend
- No persisted history of detected posts

These are deliberate next-step boundaries.
