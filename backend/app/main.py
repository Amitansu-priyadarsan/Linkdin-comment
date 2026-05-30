from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from .comment_generator import generate_comment, score_and_generate
from .models import (
    GenerateCommentRequest,
    GenerateCommentResponse,
    ScorePostsRequest,
    ScorePostsResponse,
)
from .supabase_client import get_supabase

app = FastAPI(title="LinkedIn Comment API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        # Chrome extensions have unique origins like chrome-extension://<id>
        # Using a wildcard pattern for all extensions during development.
    ],
    allow_origin_regex=r"^chrome-extension://.*$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "LinkedIn Comment API v0.2.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ── AI Endpoints ──────────────────────────────────────────────────────────────


@app.post("/api/score-posts", response_model=ScorePostsResponse)
async def api_score_posts(req: ScorePostsRequest):
    """Score ~100 posts and return top 10 with pre-generated comments.

    The extension sends all captured feed posts along with the user's
    profile context (topics, role, goal, avoid).  Gemini scores every post,
    picks the best 10, and generates a ready-to-fill comment for each.
    """
    posts_raw = [p.model_dump() for p in req.posts]
    context_raw = req.user_context.model_dump()
    print(f"[API] Received {len(posts_raw)} posts, texts: {[bool(p.get('text')) for p in posts_raw[:5]]}")

    recommendations = await score_and_generate(
        posts=posts_raw,
        user_context=context_raw,
    )
    print(f"[API] Returning {len(recommendations)} recommendations")

    # Convert dicts to PostRecommendation, clamping score to valid range
    safe_recs = []
    for r in recommendations:
        try:
            r["score"] = max(0, min(10, int(r.get("score", 5))))
            safe_recs.append(PostRecommendation(**r))
        except Exception as e:
            print(f"[API] Skipped recommendation due to validation error: {e}")
            print(f"[API] Bad rec data: {r}")

    return ScorePostsResponse(
        recommendations=safe_recs,
        total_scored=len(req.posts),
    )


@app.post("/api/generate-comment", response_model=GenerateCommentResponse)
async def api_generate_comment(req: GenerateCommentRequest):
    """Generate 1-3 comment options for a single post.

    Used when the user wants to re-generate a comment with a different tone,
    or to manually generate for a post the AI didn't originally pick.
    """
    comments = await generate_comment(
        post_text=req.post_text,
        author=req.author,
        tone=req.tone,
    )
    return GenerateCommentResponse(comments=comments)


# ── Supabase (existing) ──────────────────────────────────────────────────────


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
