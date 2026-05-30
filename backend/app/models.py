"""Request / response models for the LinkedIn Comment API."""

from pydantic import BaseModel, Field


# ── Inputs ────────────────────────────────────────────────────────────────────


class PostInput(BaseModel):
    """A single LinkedIn post captured by the network spy."""

    urn: str
    text: str | None = None
    author: str | None = None
    headline: str | None = None
    social_counts: dict | None = None


class UserContext(BaseModel):
    """User's profile and engagement preferences (set once in the popup)."""

    topics: str = ""
    role: str = ""
    goal: str = ""
    avoid: str = ""
    tone: str = Field(
        default="professional",
        pattern="^(professional|supportive|analytical|casual|witty)$",
    )


# ── Score Posts ───────────────────────────────────────────────────────────────


class ScorePostsRequest(BaseModel):
    """Batch of ~100 posts + user context for AI scoring."""

    posts: list[PostInput]
    user_context: UserContext


class PostRecommendation(BaseModel):
    """A single recommended post with its AI-generated comment."""

    urn: str
    score: int = Field(..., ge=1, le=10)
    reason: str
    author: str | None = None
    text_preview: str = ""
    comment: str = ""


class ScorePostsResponse(BaseModel):
    recommendations: list[PostRecommendation]
    total_scored: int


# ── Single Comment Generation ─────────────────────────────────────────────────


class GenerateCommentRequest(BaseModel):
    post_text: str = Field(..., min_length=10, max_length=2000)
    author: str | None = None
    tone: str = Field(
        default="professional",
        pattern="^(professional|supportive|analytical|casual|witty)$",
    )


class GenerateCommentResponse(BaseModel):
    comments: list[str]
