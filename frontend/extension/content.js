// Runs inside every linkedin.com page (see manifest content_scripts).
// `selectors.js` is loaded BEFORE this file, so window.LI_SELECTORS exists.
// `panel.js` is loaded AFTER and reads window.LI_FEED.
//
// Responsibilities:
//   - watch the feed via MutationObserver (LinkedIn lazy-renders + virtualizes)
//   - keep a URN-keyed cache of detected posts so the panel/popup has fresh data
//   - on demand, fill the comment editor of a specific post

const TEST_COMMENT = "Amazing insights. Really enjoyed this perspective.";
const LOG_PREFIX = "[LinkedIn Comment Assistant]";

console.log(`${LOG_PREFIX} content script injected on ${location.href}`);

// URN → { post object, lastSeen, element WeakRef }
// We key by URN because LinkedIn's virtualized feed reuses + removes DOM nodes
// as you scroll. The URN is the only stable identifier.
const postCache = new Map();
const listeners = new Set();

function extractPostId(postEl) {
  for (const attr of LI_SELECTORS.postIdAttrs) {
    const val = postEl.getAttribute(attr);
    if (val && val.includes("urn:li:activity:")) return val;
  }
  // Some posts nest the URN one level down — search inside.
  const nested = postEl.querySelector("[data-urn*='urn:li:activity:'], [data-id*='urn:li:activity:']");
  if (nested) {
    return nested.getAttribute("data-urn") || nested.getAttribute("data-id");
  }
  return null;
}

function extractOne(postEl, idx) {
  const authorEl = liQuery(LI_SELECTORS.postAuthor, postEl);
  const textEl = liQuery(LI_SELECTORS.postText, postEl);
  return {
    index: idx,
    postId: extractPostId(postEl),
    author: authorEl ? authorEl.innerText.trim() : null,
    text: textEl ? textEl.innerText.trim().slice(0, 500) : null,
  };
}

function scanFeedNow() {
  const postEls = liQueryAll(LI_SELECTORS.post);
  let added = 0;
  let updated = 0;

  postEls.forEach((el, idx) => {
    const post = extractOne(el, idx);
    if (!post.postId) return; // skip junk nodes
    const prior = postCache.get(post.postId);
    postCache.set(post.postId, {
      post,
      element: new WeakRef(el),
      lastSeen: Date.now(),
    });
    if (prior) updated++;
    else added++;
  });

  if (added || updated) {
    console.log(`${LOG_PREFIX} scan: +${added} new, ${updated} refreshed, ${postCache.size} total`);
    notifyListeners({ added, updated, total: postCache.size });
  }
  return getCachedPosts();
}

function getCachedPosts() {
  return Array.from(postCache.values())
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map((entry) => entry.post);
}

function getPostElement(urn) {
  const entry = postCache.get(urn);
  if (!entry) return null;
  const el = entry.element.deref();
  if (el && document.contains(el)) return el;
  // Element got recycled by virtualized scrolling — look it up again by URN.
  const fresh = document.querySelector(
    `[data-urn="${CSS.escape(urn)}"], [data-id="${CSS.escape(urn)}"]`
  );
  if (fresh) {
    entry.element = new WeakRef(fresh);
    return fresh;
  }
  return null;
}

function onPostsChanged(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners(delta) {
  for (const cb of listeners) {
    try { cb(delta, getCachedPosts()); } catch (err) { console.error(err); }
  }
}

// Quill editors don't react to plain `.textContent = "..."` — the editor
// keeps its internal model and overwrites you on the next render. The
// reliable path is: focus → execCommand('insertText'). It's deprecated
// but still the most consistent way to drive contenteditable widgets.
function fillEditor(editorEl, text) {
  editorEl.focus();

  const placeholder = editorEl.querySelector(LI_SELECTORS.emptyEditorPlaceholder);
  if (placeholder) {
    editorEl.innerHTML = "<p><br></p>";
  }

  const range = document.createRange();
  range.selectNodeContents(editorEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const inserted = document.execCommand("insertText", false, text);

  if (!inserted) {
    editorEl.innerHTML = `<p>${text}</p>`;
    editorEl.dispatchEvent(
      new InputEvent("input", { bubbles: true, cancelable: true, data: text })
    );
  }
}

async function fillCommentForPost(urn, text) {
  const targetPost = urn ? getPostElement(urn) : liQuery(LI_SELECTORS.post);
  if (!targetPost) {
    return { ok: false, reason: urn ? "post_not_visible" : "no_posts_found" };
  }

  targetPost.scrollIntoView({ behavior: "smooth", block: "center" });

  let editor = liQuery(LI_SELECTORS.commentEditor, targetPost);
  if (!editor) {
    const trigger = liQuery(LI_SELECTORS.commentTriggerButton, targetPost);
    if (!trigger) return { ok: false, reason: "no_comment_button" };
    trigger.click();
    editor = await waitForElement(LI_SELECTORS.commentEditor, targetPost, 4000);
    if (!editor) return { ok: false, reason: "editor_did_not_mount" };
  }

  fillEditor(editor, text || TEST_COMMENT);
  return { ok: true, reason: "filled", urn };
}

function highlightPost(urn) {
  const el = getPostElement(urn);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.animate(
    [
      { outline: "3px solid rgba(10, 102, 194, 0.0)", outlineOffset: "0px" },
      { outline: "3px solid rgba(10, 102, 194, 0.9)", outlineOffset: "6px" },
      { outline: "3px solid rgba(10, 102, 194, 0.0)", outlineOffset: "0px" },
    ],
    { duration: 1400, iterations: 1 }
  );
  return true;
}

function waitForElement(selectorList, root, timeoutMs) {
  return new Promise((resolve) => {
    const immediate = liQuery(selectorList, root);
    if (immediate) return resolve(immediate);

    const observer = new MutationObserver(() => {
      const el = liQuery(selectorList, root);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(root || document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// Throttle scans triggered by the feed-wide MutationObserver. LinkedIn fires
// dozens of mutations per second while scrolling — we coalesce them.
let scanScheduled = false;
function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    scanFeedNow();
  });
}

function startFeedObserver() {
  const root = document.body;
  if (!root) return;
  const observer = new MutationObserver(scheduleScan);
  observer.observe(root, { childList: true, subtree: true });
  console.log(`${LOG_PREFIX} feed observer started`);
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SCAN_FEED") {
    sendResponse({ ok: true, posts: scanFeedNow() });
    return false;
  }

  if (message?.type === "GET_CACHED_POSTS") {
    sendResponse({ ok: true, posts: getCachedPosts() });
    return false;
  }

  if (message?.type === "FILL_TEST_COMMENT") {
    fillCommentForPost(message.urn, message.text)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, reason: String(err) }));
    return true; // async response
  }

  if (message?.type === "HIGHLIGHT_POST") {
    sendResponse({ ok: highlightPost(message.urn) });
    return false;
  }

  if (message?.type === "TOGGLE_PANEL") {
    const visible = window.LI_PANEL?.toggle();
    sendResponse({ ok: true, visible });
    return false;
  }

  return false;
});

// Expose to panel.js (loaded after this file).
window.LI_FEED = {
  scanFeedNow,
  getCachedPosts,
  fillCommentForPost,
  highlightPost,
  onPostsChanged,
  TEST_COMMENT,
};

// Initial scan + start observing.
window.addEventListener("load", () => {
  setTimeout(() => {
    scanFeedNow();
    startFeedObserver();
  }, 1500);
});
