"""Smoke test for the backend (post-Gemini-removal).

Stubs the `supabase` SDK so the app imports with no network/keys, then
verifies the app boots and the health/root routes respond. The AI scoring
endpoints were removed — commenting now happens entirely client-side in the
extension (fetch posts -> user types -> post via LinkedIn API).
"""
import os
import sys
import types

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test-key")

# Stub `supabase` so `from supabase import Client` works without the package.
supabase_stub = types.ModuleType("supabase")
supabase_stub.Client = object
supabase_stub.create_client = lambda *a, **k: object()
sys.modules["supabase"] = supabase_stub

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert "LinkedIn Comment API" in r.json()["message"]


def test_no_ai_endpoints():
    # The Gemini endpoints must be gone.
    paths = {r.path for r in app.routes if hasattr(r, "path")}
    assert "/api/score-posts" not in paths
    assert "/api/generate-comment" not in paths
