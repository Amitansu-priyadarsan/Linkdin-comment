# LinkedIn Comment Assistant — Project Context

> **Share this file with any AI agent that needs to work on this project.**
> Last updated: May 2026

---

## 1. What This Project Is

A Chrome extension + Python backend that helps users write LinkedIn comments using AI. The extension **intercepts LinkedIn's internal API** to read posts (no fragile DOM selectors), sends post text to a backend for AI scoring/generation, and fills the comment into LinkedIn's editor for the user to review and post manually.

**Key constraint: LinkedIn ToS-compliant.** The backend NEVER makes any calls to LinkedIn. All LinkedIn interaction happens in the user's own browser session.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Extension | Chrome Manifest V3 | MV3 |
| Extension language | Vanilla JavaScript (no build step) | ES2022+ |
| Backend framework | Python FastAPI | 0.115.x |
| AI provider | Google Gemini via `google-genai` SDK | 2.7.0 |
| Database | Supabase (PostgreSQL) | Optional, not yet used for core features |
| Config | pydantic-settings + `.env` | 2.7.0 |

---

## 3. Directory Structure

```
e:\linkedinProject\Linkdin-comment\
├── backend\
│   ├── .env                          # SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, GEMINI_API_KEY
│   ├── requirements.txt              # fastapi, uvicorn, pydantic-settings, supabase, google-genai
│   └── app\
│       ├── __init__.py
│       ├── config.py                 # Settings(BaseSettings) — reads .env
│       ├── supabase_client.py        # Supabase client factory (existing, not used by AI features)
│       ├── models.py                 # Pydantic models: ScorePostsRequest/Response, GenerateCommentRequest/Response
│       ├── comment_generator.py      # Core AI module: score_and_generate(), generate_comment()
│       └── main.py                   # FastAPI app with endpoints
│
├── frontend\
│   └── extension\
│       ├── manifest.json             # MV3 manifest — two content script entries (MAIN + ISOLATED)
│       ├── linkedinNetworkSpy.js     # MAIN world: patches fetch/XHR to intercept Voyager API + auto-scroller
│       ├── selectors.js              # DOM selector definitions (FALLBACK only, not primary)
│       ├── content.js                # ISOLATED world: post cache, network spy listener, comment filling
│       ├── panel.js                  # Shadow DOM side panel: recommendations UI, Go & Comment
│       ├── background.js             # Service worker: AI proxy, navigation, settings, cookies
│       ├── popup.html                # Extension popup UI
│       ├── popup.js                  # Popup logic: profile, scan trigger, progress
│       ├── styles.css                # Popup styles
│       ├── patch-shadow.js           # Legacy no-op (can be deleted)
│       └── README.md                 # Extension-specific docs
│
├── Testing\                          # Test artifacts (not automated tests)
├── README.md                         # Project overview
└── walkthrough.md                    # Implementation history
```

---

## 4. Architecture (Data Flow)

```
┌─────────────────────── User's Browser ───────────────────────┐
│                                                               │
│  1. LinkedIn SPA makes API calls as user scrolls              │
│     GET /voyager/api/feed/updatesV2                           │
│                                                               │
│  2. linkedinNetworkSpy.js (MAIN world)                        │
│     ├── Patches window.fetch and XMLHttpRequest               │
│     ├── Intercepts Voyager API responses → structured JSON    │
│     ├── Captures csrf-token from request headers              │
│     ├── Provides auto-scroll function (triggered by message)  │
│     └── Sends data via window.postMessage to ISOLATED world   │
│                                                               │
│  3. content.js (ISOLATED world)                               │
│     ├── Listens for LINKEDIN_FEED_DATA messages               │
│     ├── Stores posts in URN-keyed Map (postCache)             │
│     ├── DOM scanner runs as FALLBACK if spy hasn't fired      │
│     ├── Triggers auto-scroll via START_AUTO_SCROLL message    │
│     ├── Fills comment editor via fillEditor() + execCommand   │
│     └── Auto-fills pending comments on /feed/update/ pages    │
│                                                               │
│  4. panel.js (Shadow DOM, injected into LinkedIn page)        │
│     ├── States: idle → scanning → analyzing → recommendations │
│     ├── Shows AI-picked posts with score, reason, comment     │
│     ├── "Go & Comment" → background opens new tab             │
│     └── Edit/Skip/Re-scan controls                            │
│                                                               │
│  5. background.js (Service Worker)                            │
│     ├── CHECK_LINKEDIN_LOGIN — reads li_at cookie             │
│     ├── SCORE_AND_GENERATE — calls backend /api/score-posts   │
│     ├── GENERATE_COMMENT — calls backend /api/generate-comment│
│     ├── GO_TO_POST — stores pending comment, opens tab        │
│     ├── SAVE_SETTINGS / GET_STATUS — chrome.storage           │
│     └── GET_RECOMMENDATIONS — session storage retrieval       │
│                                                               │
└───────────────────────────────────────────────────────────────┘
         │
         │  HTTP (localhost:8000)
         │  Only sends: { post_text, author, tone, user_context }
         │  Never sends: cookies, tokens, or LinkedIn credentials
         ▼
┌─────────────────────── FastAPI Backend ───────────────────────┐
│                                                               │
│  POST /api/score-posts                                        │
│    Input:  ~100 posts + user context (topics, role, goal)     │
│    Process: Chunks posts into groups of 25, scores with       │
│             Gemini, picks top 10, generates comment for each  │
│    Output: { recommendations: [{urn, score, reason, comment}] }│
│                                                               │
│  POST /api/generate-comment                                   │
│    Input:  { post_text, author, tone }                        │
│    Process: Gemini generates 3 comment options                │
│    Output: { comments: ["...", "...", "..."] }                │
│                                                               │
│  GET /health                                                  │
│    Output: { status: "ok" }                                   │
│                                                               │
│  ⚠ Backend NEVER calls LinkedIn APIs                          │
│  ⚠ Backend NEVER receives cookies or auth tokens              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 5. Key Design Decisions

### Why network interception instead of DOM selectors?
LinkedIn changes CSS classes/HTML structure monthly. The network spy intercepts LinkedIn's own Voyager API responses as structured JSON — this changes maybe once a year and gives richer data (author headline, engagement counts, timestamps) that DOM scraping cannot reliably provide.

### Why MAIN world for the spy?
`fetch` and `XMLHttpRequest` can only be patched in the page's own execution context (MAIN world). The ISOLATED world content script communicates with the spy via `window.postMessage`.

### Why does the backend never touch LinkedIn?
LinkedIn ToS compliance. Making server-side API calls with the user's cookie (from a different IP, different TLS fingerprint) is detectable and bannable. Keeping everything in-browser makes the extension indistinguishable from the user typing.

### Why auto-scroll instead of direct API calls?
Programmatically calling LinkedIn's API from the extension background worker would still be "automated access." Auto-scrolling the feed triggers LinkedIn's own lazy-loading, which the spy then intercepts — functionally equivalent to the user scrolling fast.

### Why `chrome.storage.session` for recommendations?
Recommendations are ephemeral (per-session). `session` storage is cleared when the browser closes, which is the right lifecycle for "posts to comment on today." User profile settings use `chrome.storage.local` (persistent).

### Why `execCommand('insertText')` for filling comments?
LinkedIn uses a Quill-based rich text editor. Setting `.textContent` or `.innerHTML` gets overwritten by Quill's internal model. `execCommand('insertText')` is deprecated but remains the most reliable way to programmatically fill contenteditable editors in 2026.

---

## 6. Message Protocol

### MAIN world ↔ ISOLATED world (window.postMessage)

| Message Type | Direction | Payload |
|---|---|---|
| `LINKEDIN_FEED_DATA` | MAIN → ISOLATED | `{ posts: [{urn, text, author, socialCounts, ...}] }` |
| `LINKEDIN_AUTH_CAPTURED` | MAIN → ISOLATED | `{ csrfToken: "..." }` |
| `START_AUTO_SCROLL` | ISOLATED → MAIN | `{ batches: 10 }` |
| `STOP_AUTO_SCROLL` | ISOLATED → MAIN | `{}` |
| `AUTO_SCROLL_PROGRESS` | MAIN → ISOLATED | `{ current: 5, total: 10 }` |
| `AUTO_SCROLL_COMPLETE` | MAIN → ISOLATED | `{}` |

### Content Script ↔ Background Worker (chrome.runtime)

| Message Type | Direction | Payload |
|---|---|---|
| `CHECK_LINKEDIN_LOGIN` | Any → BG | `{}` |
| `GET_STATUS` | Any → BG | `{}` |
| `SCORE_AND_GENERATE` | CS → BG | `{ posts: [...], tone }` |
| `GENERATE_COMMENT` | Any → BG | `{ postText, author, tone }` |
| `GO_TO_POST` | Panel → BG | `{ urn, commentText }` |
| `SAVE_SETTINGS` | Popup → BG | `{ userTopics, userRole, ... }` |
| `GET_RECOMMENDATIONS` | Any → BG | `{}` |
| `MARK_POST_DONE` | Panel → BG | `{ urn }` |
| `AUTO_FILL_COMPLETE` | CS → BG | `{ urn, success }` |

### Popup ↔ Content Script (chrome.tabs.sendMessage)

| Message Type | Direction | Payload |
|---|---|---|
| `SCAN_FEED` | Popup → CS | `{}` |
| `GET_CACHED_POSTS` | Popup → CS | `{}` |
| `START_SCAN` | Popup → CS | `{ mode, batches }` |
| `STOP_SCAN` | Popup → CS | `{}` |
| `GET_SCAN_STATUS` | Popup → CS | `{}` |
| `FILL_TEST_COMMENT` | Popup → CS | `{ urn?, text? }` |
| `FILL_AI_COMMENT` | BG → CS | `{ urn, text }` |
| `TOGGLE_PANEL` | Popup → CS | `{}` |
| `HIGHLIGHT_POST` | Panel → CS | `{ urn }` |

---

## 7. LinkedIn Voyager API Details

The network spy intercepts these LinkedIn internal endpoints:

| Endpoint Pattern | Data |
|---|---|
| `*/feed/updatesV2*` | Feed posts with full metadata |
| `*/feed/updates*` | Alternative feed endpoint |
| `*/socialActions*` | Like/comment/repost counts |

### Response structure (simplified)
```json
{
  "elements": [ /* top-level feed cards */ ],
  "included": [ /* all referenced entities (profiles, posts, social data) */ ]
}
```

Posts are referenced by `entityUrn` (e.g., `urn:li:activity:7123456789`). Direct post URLs follow the pattern:
```
https://www.linkedin.com/feed/update/urn:li:activity:7123456789/
```

### Auth headers captured (for display/status only, NOT sent to backend)
- `csrf-token` — from outgoing request headers
- `li_at` — session cookie (read via `chrome.cookies` API in background worker)

---

## 8. AI Prompts

### Scoring prompt (in `comment_generator.py`)
- Takes user profile (role, topics, goal, avoid) + batch of 25 posts
- Scores each post 1-10 on comment-worthiness
- Returns JSON array with `urn`, `score`, `reason`

### Comment generation prompt
- Takes post text, author name, user role, tone selection
- Rules: 1-3 sentences, reference something specific, no generic openers
- Returns 3 comment options separated by `---`

### Available tones
`professional` | `supportive` | `analytical` | `casual` | `witty`

---

## 9. Storage Schema

### chrome.storage.local (persistent)
```
backendUrl:    string   — e.g., "http://localhost:8000"
userTopics:    string   — e.g., "AI, startups, SaaS"
userRole:      string   — e.g., "Founder building dev tools"
userGoal:      string   — e.g., "Build authority"
userAvoid:     string   — e.g., "Hiring, politics"
scanMode:      string   — "auto" | "manual"
```

### chrome.storage.session (per-session, cleared on browser close)
```
recommendations: array  — [{urn, score, reason, author, text_preview, comment, done?}]
lastScoredAt:    number  — timestamp
pendingComment:  object  — {urn, text} — cleared after auto-fill
```

---

## 10. DOM Selectors (Fallback Only)

Defined in `selectors.js`. These are ONLY used as fallback when the network spy hasn't captured data yet, and for the comment editor (which must be interacted with via DOM).

**Actively used selectors:**
- `commentEditor`: `div[contenteditable="true"][role="textbox"]` — stable HTML attribute
- `commentTriggerButton`: `button[aria-label*="omment"]` — opens comment section

**Fallback-only selectors** (for post reading when API interception fails):
- `post`: `article.main-feed-activity-card`
- `postAuthor`: `a[data-tracking-control-name="feed_main-feed-card_feed-actor-name"]`
- `postText`: `p[data-test-id="main-feed-activity-card__commentary"]`

---

## 11. Running the Project

### Backend
```bash
cd e:\linkedinProject\Linkdin-comment\backend
# Set GEMINI_API_KEY in .env
uvicorn app.main:app --reload --port 8000
```

### Extension
1. `chrome://extensions/` → Enable Developer Mode
2. "Load unpacked" → select `frontend/extension/`
3. Open `https://www.linkedin.com/feed/`

### User flow
1. Open popup → fill profile (topics, role, goal, avoid)
2. Click "Scan & Find Posts"
3. Auto-scroll captures ~100 posts (20 seconds)
4. AI scores and picks top 10 with pre-written comments
5. Click "Go & Comment" → new tab → comment auto-fills
6. User clicks LinkedIn's "Post" button

---

## 12. Known Limitations & Future Work

| Limitation | Why | Future Fix |
|---|---|---|
| Requires browser open with LinkedIn tab | Network interception only works in active browser | Cloud headless browser (Playwright) — but violates ToS |
| Limited to user's feed posts | Only intercepts what LinkedIn loads | Could add search endpoint interception |
| ~100 posts max per scan | Auto-scroll limited to ~10 batches | Increase batch count or add pagination |
| No comment history tracking | Supabase tables not yet created | Add `comment_history` table |
| No multi-account support | Single browser session | Separate Chrome profiles |
| httpx version conflict | `google-genai` needs httpx 0.28+, supabase needs <0.28 | Pin compatible versions or isolate |

---

## 13. Important Files to Read First

If you're a new AI agent working on this project, read these files in order:

1. **This file** — you're reading it
2. [manifest.json](file:///e:/linkedinProject/Linkdin-comment/frontend/extension/manifest.json) — extension structure and permissions
3. [linkedinNetworkSpy.js](file:///e:/linkedinProject/Linkdin-comment/frontend/extension/linkedinNetworkSpy.js) — how we capture LinkedIn data
4. [content.js](file:///e:/linkedinProject/Linkdin-comment/frontend/extension/content.js) — central content script logic
5. [background.js](file:///e:/linkedinProject/Linkdin-comment/frontend/extension/background.js) — message routing and backend communication
6. [comment_generator.py](file:///e:/linkedinProject/Linkdin-comment/backend/app/comment_generator.py) — AI scoring and generation logic
7. [main.py](file:///e:/linkedinProject/Linkdin-comment/backend/app/main.py) — API endpoints
8. [selectors.js](file:///e:/linkedinProject/Linkdin-comment/frontend/extension/selectors.js) — DOM selectors (fallback + comment editor)
