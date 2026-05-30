"""AI-powered post scoring and comment generation using Google Gemini.

This module is the backend's ONLY job — the server never talks to LinkedIn.
It receives post text from the extension and returns AI-generated content.
"""

import asyncio
import json
import logging
import re

from google import genai

from .config import get_settings

logger = logging.getLogger(__name__)

# ── Tone descriptions ─────────────────────────────────────────────────────────

TONE_DESC = {
    "professional": "professional, insightful, and credible",
    "supportive": "warm, encouraging, and supportive",
    "analytical": "data-driven, analytical, and thoughtful",
    "casual": "friendly, conversational, and relatable",
    "witty": "clever, witty, with a subtle touch of humor",
}

# ── Prompts ───────────────────────────────────────────────────────────────────

# Combined scoring + comment generation in ONE call to minimize API usage
SCORE_AND_COMMENT_PROMPT = """\
You are a LinkedIn engagement strategist.

USER PROFILE:
- Role: {role}
- Topics of interest: {topics}
- Goal: {goal}
- Avoid these topics: {avoid}
- Comment tone: {tone_desc}

TASK:
1. Score each post 1-10 on "comment-worthiness" for this user
2. For the TOP 5 highest-scoring posts (score 7+), also write a comment

Scoring criteria:
- Relevance to user's topics (0-3 points)
- Post has enough substance to write a meaningful comment (0-2 points)
- Author is worth engaging with for user's goals (0-2 points)
- Engagement potential — fresh, growing discussion (0-2 points)
- NOT promotional/spam/hiring/motivational fluff (0-1 points)

Comment rules (for top posts only):
- 1-3 sentences, natural and human
- Add genuine value or ask a thoughtful question
- Reference something SPECIFIC from the post
- No generic openers ("Great post!", "Love this!", "Thanks for sharing!")
- 0-1 emoji max, no hashtags
- Sound like a real person, not a bot

POSTS:
{formatted_posts}

Return ONLY a valid JSON array. No markdown fences, no commentary.
For ALL posts include urn and score. For top posts also include comment.
Example:
[
  {{"urn":"urn:li:activity:123","score":9,"reason":"Relevant to AI","comment":"The point about..."}},
  {{"urn":"urn:li:activity:456","score":4,"reason":"Off-topic hiring post"}}
]"""

COMMENT_PROMPT = """\
Write a LinkedIn comment on this post.
You are: {role}
Tone: {tone_desc}

Post by {author}:
\"{text}\"

Rules:
- 1-3 sentences, natural and human
- Add genuine value or ask a thoughtful question
- Reference something SPECIFIC from the post
- Do NOT start with generic openers ("Great post!", "Love this!", "Thanks for sharing!")
- Do NOT be sycophantic or overly flattering
- 0-1 emoji maximum, no hashtags
- Sound like a real person, not a bot

Write exactly 3 different comment options, separated by the delimiter ---
"""

# ── Helpers ───────────────────────────────────────────────────────────────────


def _get_client() -> genai.Client:
    """Initialise and return a Gemini client instance."""
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


def _format_posts_for_scoring(posts: list[dict]) -> str:
    """Format a batch of posts into a numbered list for the scoring prompt."""
    lines: list[str] = []
    for i, p in enumerate(posts, 1):
        text = (p.get("text") or "")[:400]
        if not text:
            continue  # Skip posts with no text
        author = p.get("author") or "Unknown"
        headline = p.get("headline") or ""
        urn = p.get("urn") or f"unknown_{i}"
        social = p.get("social_counts") or {}
        likes = social.get("likes", "?")
        comments = social.get("comments", "?")

        lines.append(
            f"[{i}] URN: {urn}\n"
            f"    Author: {author} — {headline}\n"
            f"    Engagement: {likes} likes, {comments} comments\n"
            f'    Text: "{text}"'
        )
    return "\n\n".join(lines)


def _extract_json(text: str) -> list[dict]:
    """Best-effort extraction of a JSON array from LLM output."""
    text = text.strip()
    if text.startswith("["):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    m = re.search(r"```(?:json)?\s*(\[[\s\S]*?\])\s*```", text)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass

    m = re.search(r"\[[\s\S]*\]", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass

    logger.warning("Could not parse JSON from LLM response: %s", text[:200])
    return []


async def _call_gemini_with_retry(client, prompt, max_retries=3):
    """Call Gemini with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
            return response.text
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate" in error_str or "quota" in error_str:
                wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                logger.warning(
                    "Rate limited (attempt %d/%d). Waiting %ds...",
                    attempt + 1, max_retries, wait_time
                )
                await asyncio.sleep(wait_time)
            else:
                logger.exception("Gemini call failed (non-rate-limit)")
                raise
    raise Exception("Max retries exceeded due to rate limiting")


# ── Public API ────────────────────────────────────────────────────────────────


async def score_and_generate(
    posts: list[dict],
    user_context: dict,
) -> list[dict]:
    """Score posts and generate comments for top picks.

    Uses a COMBINED prompt that scores AND generates comments in a single
    API call per chunk, minimizing the number of Gemini calls to stay
    within free-tier rate limits (~15 req/min).

    Args:
        posts: List of post dicts with urn, text, author, headline, social_counts.
        user_context: Dict with topics, role, goal, avoid, tone.

    Returns:
        Top-10 list of dicts with urn, score, reason, author,
        text_preview, and a pre-generated comment.
    """
    if not posts:
        return []

    # Filter out posts with no text
    posts_with_text = [p for p in posts if p.get("text")]
    if not posts_with_text:
        return []

    client = _get_client()
    role = user_context.get("role", "a professional")
    tone = user_context.get("tone", "professional")
    tone_desc = TONE_DESC.get(tone, TONE_DESC["professional"])

    # ── Score + generate in large chunks (fewer API calls) ────────────────
    # Use chunks of 50 to minimize calls. With ~100 posts = 2 API calls.
    chunk_size = 50
    all_scored: list[dict] = []

    for start in range(0, len(posts_with_text), chunk_size):
        chunk = posts_with_text[start : start + chunk_size]
        formatted = _format_posts_for_scoring(chunk)

        if not formatted.strip():
            continue

        prompt = SCORE_AND_COMMENT_PROMPT.format(
            role=role,
            topics=user_context.get("topics", "general business"),
            goal=user_context.get("goal", "networking"),
            avoid=user_context.get("avoid", "nothing specific"),
            tone_desc=tone_desc,
            formatted_posts=formatted,
        )

        try:
            response_text = await _call_gemini_with_retry(client, prompt)
            print(f"[AI] Raw Gemini response: {response_text[:500]}")
            scored = _extract_json(response_text)
            print(f"[AI] Parsed {len(scored)} scored posts from chunk")
            all_scored.extend(scored)
        except Exception as e:
            print(f"[AI] ERROR in scoring chunk at {start}: {e}")
            logger.exception(
                "Gemini scoring failed for chunk starting at %d", start
            )

        # Rate limit pause between chunks
        if start + chunk_size < len(posts_with_text):
            await asyncio.sleep(3)

    # Build a lookup from URN → original post data
    post_lookup = {p["urn"]: p for p in posts if p.get("urn")}
    print(f"[AI] Post lookup has {len(post_lookup)} entries")
    print(f"[AI] Total scored results: {len(all_scored)}")

    # ── Sort and pick top 10 ────────────────────────────────────────────
    all_scored.sort(key=lambda x: x.get("score", 0), reverse=True)
    top_picks = all_scored[:10]
    print(f"[AI] Top picks: {[(p.get('urn','?')[:30], p.get('score',0)) for p in top_picks]}")

    # ── Build results ────────────────────────────────────────────────────
    results: list[dict] = []

    for pick in top_picks:
        urn = pick.get("urn", "")
        original = post_lookup.get(urn, {})
        # Fall back to searching posts list if exact URN match fails
        if not original:
            for p in posts:
                if p.get("urn") and urn and p["urn"] in urn or urn in p.get("urn", ""):
                    original = p
                    break

        post_text = original.get("text") or pick.get("text", "") or ""
        author = original.get("author") or pick.get("author", "someone")

        comment = pick.get("comment", "")

        # If no comment from combined prompt, generate one separately
        if not comment and post_text:
            try:
                await asyncio.sleep(2)
                comment = await _generate_single_comment(
                    client, post_text, author, role, tone
                )
            except Exception as e:
                print(f"[AI] Comment generation failed for {urn}: {e}")
                comment = "Interesting perspective — thanks for sharing."

        # Always include scored posts, even without AI comment
        if not comment:
            comment = "Interesting perspective — thanks for sharing."

        results.append(
            {
                "urn": urn,
                "score": pick.get("score", 0),
                "reason": pick.get("reason", ""),
                "author": author,
                "text_preview": post_text[:150] if post_text else "(no text captured)",
                "comment": comment,
            }
        )

    print(f"[AI] Final results: {len(results)} recommendations")
    return results


async def generate_comment(
    post_text: str,
    author: str | None = None,
    tone: str = "professional",
) -> list[str]:
    """Generate 1-3 comment options for a single post."""
    client = _get_client()
    role = "a professional"

    comments = await _generate_single_comment(
        client,
        post_text,
        author or "someone",
        role,
        tone,
        return_all=True,
    )

    if isinstance(comments, list):
        return comments
    return [comments]


async def _generate_single_comment(
    client: genai.Client,
    post_text: str,
    author: str,
    role: str,
    tone: str,
    *,
    return_all: bool = False,
) -> str | list[str]:
    """Call Gemini to generate comment(s) for a single post."""
    tone_desc = TONE_DESC.get(tone, TONE_DESC["professional"])

    prompt = COMMENT_PROMPT.format(
        role=role,
        tone_desc=tone_desc,
        author=author,
        text=post_text[:1000],
    )

    try:
        response_text = await _call_gemini_with_retry(client, prompt)
        raw = response_text.strip()
        options = [c.strip() for c in raw.split("---") if c.strip()]

        if return_all:
            return options[:3] or [raw]
        return options[0] if options else raw
    except Exception:
        logger.exception("Gemini comment generation failed")
        fallback = "Interesting perspective — thanks for sharing this."
        return [fallback] if return_all else fallback
