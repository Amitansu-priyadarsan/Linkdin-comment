"""Direct test of the Gemini scoring pipeline — bypasses FastAPI."""
import asyncio
import sys
sys.path.insert(0, ".")

from app.comment_generator import score_and_generate, _get_client, _call_gemini_with_retry, _format_posts_for_scoring, _extract_json, SCORE_AND_COMMENT_PROMPT, TONE_DESC

async def test():
    posts = [
        {
            "urn": "urn:li:activity:test1",
            "text": "AI is fundamentally changing how startups build products. We are seeing 10x faster iteration cycles with AI-assisted development.",
            "author": "John Doe",
            "headline": "CEO at TechCo",
        }
    ]
    user_context = {
        "topics": "AI, startups",
        "role": "developer",
        "goal": "networking",
        "avoid": "",
        "tone": "professional",
    }

    # Step 1: Test client
    print("--- Step 1: Get client ---")
    try:
        client = _get_client()
        print(f"Client OK: {type(client)}")
    except Exception as e:
        print(f"FAILED to get client: {e}")
        return

    # Step 2: Test raw Gemini call
    print("\n--- Step 2: Raw Gemini call ---")
    try:
        response_text = await _call_gemini_with_retry(client, "Say hello in one word.")
        print(f"Raw response: {response_text}")
    except Exception as e:
        print(f"FAILED raw call: {e}")
        return

    # Step 3: Test formatted prompt
    print("\n--- Step 3: Format posts ---")
    formatted = _format_posts_for_scoring(posts)
    print(f"Formatted:\n{formatted}")

    # Step 4: Test scoring prompt
    print("\n--- Step 4: Scoring prompt ---")
    tone_desc = TONE_DESC.get("professional")
    prompt = SCORE_AND_COMMENT_PROMPT.format(
        role="developer",
        topics="AI, startups",
        goal="networking",
        avoid="nothing",
        tone_desc=tone_desc,
        formatted_posts=formatted,
    )
    print(f"Prompt length: {len(prompt)} chars")

    try:
        response_text = await _call_gemini_with_retry(client, prompt)
        print(f"Gemini response:\n{response_text}")
    except Exception as e:
        print(f"FAILED scoring call: {e}")
        return

    # Step 5: Parse JSON
    print("\n--- Step 5: Parse JSON ---")
    scored = _extract_json(response_text)
    print(f"Parsed: {scored}")

    # Step 6: Full pipeline
    print("\n--- Step 6: Full pipeline ---")
    results = await score_and_generate(posts, user_context)
    print(f"Results: {results}")

asyncio.run(test())
