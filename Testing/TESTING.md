# Testing & Verification Guide

How to load, test, and debug the LinkedIn Comment Assistant after the Shadow DOM panel + scraping work.

> **Important honesty disclaimer**
> LinkedIn's DOM class names change frequently. The selectors in
> [frontend/extension/selectors.js](frontend/extension/selectors.js) are
> educated guesses with fallbacks. They may or may not match today's LinkedIn.
> The Shadow DOM panel is your diagnostic tool — use it to verify, and patch
> selectors when they break.

---

## 1. What changed in this round

| Area | File | What it does now |
|---|---|---|
| Scraping | [frontend/extension/content.js](frontend/extension/content.js) | `MutationObserver` watches the feed, URN-keyed cache survives virtualized scroll, per-post `fillCommentForPost(urn)` |
| Panel UI | [frontend/extension/panel.js](frontend/extension/panel.js) | **New.** Floating Shadow DOM panel — isolated CSS, lists posts, hover-to-highlight, per-post fill button |
| Manifest | [frontend/extension/manifest.json](frontend/extension/manifest.json) | `panel.js` added to content scripts |
| Popup | [frontend/extension/popup.html](frontend/extension/popup.html), [popup.js](frontend/extension/popup.js) | Added **Toggle Panel** button |
| Dashboard | [frontend/src/app/page.tsx](frontend/src/app/page.tsx), [layout.tsx](frontend/src/app/layout.tsx) | Replaced create-next-app boilerplate; probes `/health` + `/supabase/ping` |
| API client | [frontend/src/lib/api.ts](frontend/src/lib/api.ts) | **New.** Fetch wrapper, base URL via `NEXT_PUBLIC_API_BASE` |

Nothing in the backend changed.

---

## 2. Load the extension

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** → select [frontend/extension/](frontend/extension/).
4. **If you previously loaded an older version**, click the reload icon on the extension card so the new files (`panel.js`, updated `content.js`) take effect.
5. Pin the extension to the toolbar so the popup is one click away.

---

## 3. Verify scraping (the 60-second smoke test)

1. Go to `https://www.linkedin.com/feed/`.
2. A floating panel should appear on the **top-right** with a vertical **PANEL** pull-tab on its left edge.
3. Look at the badge in the panel header — it shows post count.

### Decision tree

| What you see | What it means | What to do |
|---|---|---|
| Panel shows **N posts** (N > 0) with names + previews | `post`, `postAuthor`, `postText` selectors all work | Move to Step 4 |
| Panel appears but says **"No posts detected yet"** even after scrolling | The `post` selector in [selectors.js](frontend/extension/selectors.js#L14) doesn't match | See [§5 Patch a broken selector](#5-patch-a-broken-selector) |
| Panel does not appear at all | Content script didn't run, OR shadow root failed to inject | Open DevTools console on linkedin.com, look for `[LinkedIn Comment Assistant]` log. If missing, the script isn't injecting — recheck `chrome://extensions` reload step |
| Posts listed but **author = "Unknown"** | `postAuthor` selector doesn't match | Patch `postAuthor` array in [selectors.js](frontend/extension/selectors.js#L21) |
| Posts listed but **text = "(no text)"** | `postText` selector doesn't match | Patch `postText` array in [selectors.js](frontend/extension/selectors.js#L29) |

---

## 4. Verify comment filling

1. In the panel, **hover** any row. The matching post in the feed should briefly outline in LinkedIn blue.
2. Click **Fill comment** on a row.
3. Expected: the page scrolls to that post, the comment editor opens, and the test text appears: *"Amazing insights. Really enjoyed this perspective."*
4. **Do NOT** click LinkedIn's Post button unless you actually want to comment.

### If filling fails, the panel button briefly shows a reason:

| Reason text | Meaning | Fix |
|---|---|---|
| `post_not_visible` | The cached post got recycled out of the DOM as you scrolled away | Scroll back so the post is on screen, click again |
| `no_comment_button` | `commentTriggerButton` selectors don't match | Inspect the comment button on a real post → update [selectors.js](frontend/extension/selectors.js#L40) |
| `editor_did_not_mount` | Comment button clicked but `.ql-editor` (or fallback) never appeared within 4 s | Update `commentEditor` array in [selectors.js](frontend/extension/selectors.js#L47) |
| `no_posts_found` | No post detected at all when you used **Fill first post** | See decision tree above — `post` selector is the culprit |

---

## 5. Patch a broken selector

LinkedIn renames CSS classes every few months. The fix is mechanical:

1. On LinkedIn, right-click the element that should be detected (e.g., a feed card, the author name, the post text, the Comment button, or the comment editor).
2. **Inspect** → look at the element in DevTools.
3. Find a class or attribute that looks **structural** (not state-y, not utility-noise). Good signals:
   - Anything with `data-urn` or `data-id` (very stable)
   - `aria-label` for buttons
   - Component-prefix classes like `comments-comment-box__...` or `update-components-...`
4. Open [frontend/extension/selectors.js](frontend/extension/selectors.js).
5. **Add your new selector to the FRONT of the matching array** (the file evaluates left-to-right). Don't delete the old ones — leave them as fallbacks.
6. Reload the extension on `chrome://extensions`. Refresh LinkedIn.

Example: if posts stop being detected and you find that the container is now `<div class="feed-update-card-v3">`, edit the `post` array like this:

```js
post: [
  'div.feed-update-card-v3',           // ← new, added to front
  'div.feed-shared-update-v2',          // ← old, kept as fallback
  'div[data-id^="urn:li:activity:"]',
  // ...
],
```

---

## 6. Console & background debugging

- **Content-script logs**: open DevTools **on the LinkedIn page** → Console. Look for lines prefixed with `[LinkedIn Comment Assistant]`.
- **Background service worker logs**: `chrome://extensions` → find the extension card → click **Service worker** (under "Inspect views"). A DevTools window opens for the background script.
- **Popup logs**: right-click the extension's toolbar icon → **Inspect popup**. DevTools attach to the popup window.

Quick checks from the LinkedIn page console (these are exposed by `content.js`):

```js
LI_FEED.getCachedPosts()       // → array of detected posts
LI_FEED.scanFeedNow()          // → force a rescan immediately
LI_FEED.fillCommentForPost('urn:li:activity:XXXX')  // → fill a specific post
LI_FEED.highlightPost('urn:li:activity:XXXX')       // → flash outline on a post
LI_PANEL.toggle()              // → show/hide the panel
```

---

## 7. Backend (FastAPI)

Run from the repo root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # fill in SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY
uvicorn app.main:app --reload
```

Smoke tests:

```bash
curl http://localhost:8000/health
# → {"status":"ok"}

curl http://localhost:8000/supabase/ping
# → {"ok":true,"rows":[...]}   (requires a 'todos' table in Supabase)
```

If `/supabase/ping` returns 500, the dashboard's Supabase card will show the error message. That's expected behavior until you create the `todos` table or change the endpoint.

---

## 8. Dashboard (Next.js)

```bash
cd frontend
npm install     # only first time
npm run dev
```

Open `http://localhost:3000`.

- The page auto-pings `/health` and `/supabase/ping` on load.
- Green dot = endpoint returned 200. Red dot = error (message shown below).
- Click **Refresh** to re-probe.
- To point at a non-local backend, set `NEXT_PUBLIC_API_BASE` before `npm run dev`:
  ```bash
  NEXT_PUBLIC_API_BASE=https://api.example.com npm run dev
  ```

---

## 9. What is intentionally **not** built

These were explicitly out of scope for this MVP:

- No AI comment generation
- No auto-submission of comments — user must click LinkedIn's Post button
- No network calls from the extension to the backend (the extension and backend are decoupled today)
- No persisted history of detected posts
- No authentication on the backend
- No dashboard ↔ extension communication

---

## 10. Known fragile spots

| Spot | Why it's fragile | Mitigation in code |
|---|---|---|
| LinkedIn CSS class names | Renamed often | Fallback arrays in [selectors.js](frontend/extension/selectors.js); panel surfaces failures visibly |
| Quill `execCommand('insertText')` | Deprecated API | Synthetic `input` event fallback at [content.js:fillEditor](frontend/extension/content.js) |
| Virtualized feed recycling DOM nodes | Cached `element` ref goes stale | URN re-lookup in `getPostElement()` (content.js) |
| MutationObserver firing hundreds of times per scroll | Performance hit | `requestAnimationFrame` coalescing in `scheduleScan()` |
| Shadow DOM `:host` positioning | Some sites override `all` resets | Host element also gets `position: fixed; z-index: 2147483647` inline |

---

## 11. Reporting issues back

When something doesn't work, the most useful info to capture:

1. The exact panel state ("0 posts" / "N posts but author=Unknown" / etc.).
2. The console output on the LinkedIn page filtered to `[LinkedIn Comment Assistant]`.
3. The HTML of one feed card from DevTools (right-click → Copy → Copy outerHTML, then trim sensitive content).
4. For comment-fill failures: the reason string the panel button briefly showed.

Those four together tell you (or me) exactly which selector array to patch.
