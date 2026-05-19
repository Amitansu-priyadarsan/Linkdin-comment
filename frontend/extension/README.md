# LinkedIn Comment Assistant — MVP

Chrome Manifest V3 extension that:

1. Detects whether you're signed in to LinkedIn (via the `li_at` cookie).
2. Reads visible feed posts (author, text, post id) and logs them.
3. Pre-fills a test comment on the first feed post — **you click submit**.

No AI, no backend, no auto-submit.

---

## Files

| File             | Role                                                                       |
| ---------------- | -------------------------------------------------------------------------- |
| `manifest.json`  | MV3 declaration: permissions, host scope, scripts, popup.                  |
| `selectors.js`   | All LinkedIn DOM selectors with fallbacks. **Edit here when LinkedIn changes.** |
| `background.js`  | Service worker. Uses `chrome.cookies` to check login (popup can't).         |
| `content.js`     | Runs on linkedin.com. Scans the feed and fills the comment editor.          |
| `popup.html`     | Browser-action popup UI.                                                    |
| `popup.js`       | Popup logic — sends messages to background + content.                       |
| `styles.css`     | Popup styling.                                                              |

`selectors.js` is loaded BEFORE `content.js` via the `content_scripts` array, so `content.js` can use `window.LI_SELECTORS`, `liQuery()`, and `liQueryAll()` directly.

---

## Load into Chrome (Developer Mode)

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select this folder: `frontend/extension/`.
5. The extension appears in the toolbar. Pin it for easy access.

After editing any file, click the **reload** ↻ icon on the extension card. For content-script changes you also need to reload the LinkedIn tab.

---

## Test on LinkedIn safely

> LinkedIn aggressively rate-limits and bans automation. For MVP testing keep usage minimal and **never auto-submit**.

1. Sign in to LinkedIn in the same Chrome profile.
2. Open `https://www.linkedin.com/feed/`.
3. Open the page DevTools console (`Cmd+Opt+J`). You should see:
   ```
   [LinkedIn Comment Assistant] content script injected on https://www.linkedin.com/feed/
   [LinkedIn Comment Assistant] detected N feed posts [ {...}, ... ]
   ```
4. Click the extension icon. The popup shows **Logged in to LinkedIn** (green dot).
5. Click **Scan Feed Posts** → re-runs the scan and logs counts.
6. Click **Post Test Comment** → the first post scrolls into view, its comment editor opens, and the text *"Amazing insights. Really enjoyed this perspective."* is pre-filled.
7. **Review the comment**, then click LinkedIn's native **Post** button yourself.

### Troubleshooting

| Symptom                          | Fix                                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| Popup shows "Not logged in"      | Sign in to LinkedIn in this browser profile, then reopen the popup.                            |
| "no_posts_found"                 | LinkedIn changed post selectors. Update `LI_SELECTORS.post` in [`selectors.js`](selectors.js). |
| "no_comment_button"              | Update `LI_SELECTORS.commentTriggerButton`.                                                    |
| "editor_did_not_mount"           | The Quill editor took longer than 4 s to render. Try again, or bump the timeout in `content.js`. |
| Text appears in the wrong place  | LinkedIn changed the editor element. Update `LI_SELECTORS.commentEditor`.                      |
| Nothing logs in the console      | The content script wasn't injected. Reload the LinkedIn tab; check `chrome://extensions` for errors. |

### When LinkedIn breaks the selectors

1. Open DevTools on the LinkedIn feed.
2. Right-click the broken element (post container, author span, comment box) → **Inspect**.
3. Copy a stable selector — prefer attributes (`data-urn`, `aria-label`, `role`) over class names with hashes.
4. Add it to the **front** of the corresponding array in [`selectors.js`](selectors.js).
5. Reload the extension and the LinkedIn tab.

---

## What this extension does NOT do (intentional, per MVP scope)

- No AI comment generation
- No backend network calls
- No auto-submit — user must click Post
- No comment history / storage beyond what `chrome.storage` could later hold
