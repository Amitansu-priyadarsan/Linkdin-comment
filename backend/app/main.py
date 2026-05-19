from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from .supabase_client import get_supabase

app = FastAPI(title="LinkedIn Comment API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "LinkedIn Comment API"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/supabase/ping")
async def supabase_ping(client: Client = Depends(get_supabase)):
    """Smoke test: confirms the Supabase client is configured and reachable.

    Reads from the `todos` table (matching the snippet you pasted). If the
    table doesn't exist yet, Supabase returns a clear error.
    """
    try:
        response = client.table("todos").select("*").limit(1).execute()
        return {"ok": True, "rows": response.data}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc
