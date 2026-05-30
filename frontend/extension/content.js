// Runs inside every linkedin.com page (see manifest content_scripts).
// `selectors.js` is loaded BEFORE this file, so window.LI_SELECTORS exists.
// `panel.js` is loaded AFTER and reads window.LI_FEED.
//
// Responsibilities (v2):
//   - listen for MAIN-world network spy data (primary source — structured JSON)
//   - fallback: watch the feed via MutationObserver (LinkedIn DOM scanner)
//   - keep a URN-keyed cache of detected posts so the panel/popup has fresh data
//   - trigger auto-scroll + AI scoring via background worker
//   - on demand, fill the comment editor of a specific post
//   - auto-fill comments when navigating to a direct post URL

const TEST_COMMENT = "Amazing insights. Really enjoyed this perspective.";
const LOG_PREFIX = "[LinkedIn Comment Assistant]";

console.log(`${LOG_PREFIX} content script injected on ${location.href}`);

// URN → { post object, lastSeen, element WeakRef }
// We key by URN because LinkedIn's virtualized feed reuses + removes DOM nodes
// as you scroll. The URN is the only stable identifier.
const postCache = new Map();
const listeners = new Set();

// Captured auth metadata from the network spy (for display/status only)
let capturedCsrfToken = null;

// ── Network Spy Listener (PRIMARY post source) ─────────────────────────────
// The MAIN-world linkedinNetworkSpy.js sends structured post data as JSON
// from intercepted Voyager API responses.  Zero DOM dependency.

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  // Feed post data from Voyager API interception
  if (event.data.type === "LINKEDIN_FEED_DATA") {
    const apiPosts = event.data.posts || [];
    let added = 0;

    for (const post of apiPosts) {
      if (!post.urn) continue;

      const existing = postCache.has(post.urn);
      postCache.set(post.urn, {
        post: {
          postId: post.urn,
          author: post.author?.name || null,
          headline: post.author?.headline || null,
          text: post.text?.slice(0, 500) || null,
          socialCounts: post.socialCounts || null,
          timestamp: post.timestamp || null,
          source: "api",
        },
        element: null, // no DOM ref for API-sourced posts
        lastSeen: Date.now(),
      });

      if (!existing) added++;
    }

    if (added) {
      console.log(
        `${LOG_PREFIX} API intercept: +${added} posts, ${postCache.size} total`
      );
      notifyListeners({ added, updated: 0, total: postCache.size });
    }
  }

  // Auth metadata
  if (event.data.type === "LINKEDIN_AUTH_CAPTURED") {
    capturedCsrfToken = event.data.csrfToken;
    console.log(`${LOG_PREFIX} CSRF token captured from network`);
  }

  // Auto-scroll progress
  if (event.data.type === "AUTO_SCROLL_PROGRESS") {
    notifyListeners({
      scrollProgress: event.data.current,
      scrollTotal: event.data.total,
      total: postCache.size,
    });
  }

  // Auto-scroll complete
  if (event.data.type === "AUTO_SCROLL_COMPLETE") {
    console.log(
      `${LOG_PREFIX} Auto-scroll complete. ${postCache.size} posts captured.`
    );
    notifyListeners({
      scrollComplete: true,
      total: postCache.size,
    });
  }
});

// ── DOM Scanner (FALLBACK post source) ──────────────────────────────────────

function extractPostId(postEl) {
  for (const attr of LI_SELECTORS.postIdAttrs) {
    const val = postEl.getAttribute(attr);
    if (val && val.includes("urn:li:activity:")) return val;
  }
  // Some posts nest the URN one level down — search inside.
  const nested = postEl.querySelector(
    "[data-urn*='urn:li:activity:'], [data-id*='urn:li:activity:']"
  );
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
    source: "dom",
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

    // Don't overwrite API-sourced data with DOM data (API is richer)
    if (prior && prior.post.source === "api") {
      // Just update the element reference
      prior.element = new WeakRef(el);
      prior.lastSeen = Date.now();
      updated++;
      return;
    }

    postCache.set(post.postId, {
      post,
      element: new WeakRef(el),
      lastSeen: Date.now(),
    });
    if (prior) updated++;
    else added++;
  });

  if (added || updated) {
    console.log(
      `${LOG_PREFIX} DOM scan: +${added} new, ${updated} refreshed, ${postCache.size} total`
    );
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
  const el = entry.element?.deref?.();
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
    try {
      cb(delta, getCachedPosts());
    } catch (err) {
      console.error(err);
    }
  }
}

// ── Comment Editor ──────────────────────────────────────────────────────────

// Quill editors don't react to plain `.textContent = "..."` — the editor
// keeps its internal model and overwrites you on the next render. The
// reliable path is: focus → execCommand('insertText'). It's deprecated
// but still the most consistent way to drive contenteditable widgets.
function fillEditor(editorEl, text) {
  editorEl.focus();

  const placeholder = editorEl.querySelector(
    LI_SELECTORS.emptyEditorPlaceholder
  );
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
  // When on a direct post page, search the entire page (no specific post container)
  const isPostPage = location.pathname.startsWith("/feed/update/");
  let targetPost;

  if (isPostPage) {
    // On a single post page, the post is the main content
    targetPost = document.querySelector("article") || document.querySelector(".feed-shared-update-v2") || document.body;
  } else {
    targetPost = urn ? getPostElement(urn) : liQuery(LI_SELECTORS.post);
  }

  if (!targetPost) {
    return { ok: false, reason: urn ? "post_not_visible" : "no_posts_found" };
  }

  if (!isPostPage) {
    targetPost.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Search for comment editor — try the post container first, then the whole page
  let editor = liQuery(LI_SELECTORS.commentEditor, targetPost);
  if (!editor && isPostPage) {
    editor = liQuery(LI_SELECTORS.commentEditor);
  }

  if (!editor) {
    // Try to open the comment section first
    const trigger = liQuery(LI_SELECTORS.commentTriggerButton, targetPost) ||
      (isPostPage ? liQuery(LI_SELECTORS.commentTriggerButton) : null);
    if (!trigger) return { ok: false, reason: "no_comment_button" };
    trigger.click();

    editor = await waitForElement(
      LI_SELECTORS.commentEditor,
      isPostPage ? document.body : targetPost,
      4000
    );
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
    observer.observe(root || document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// ── Auto-Scroll Trigger ─────────────────────────────────────────────────────

function startAutoScroll(batches = 10) {
  window.postMessage({ type: "START_AUTO_SCROLL", batches }, "*");
}

function stopAutoScroll() {
  window.postMessage({ type: "STOP_AUTO_SCROLL" }, "*");
}

// ── Auto-Fill on Direct Post Pages ──────────────────────────────────────────
// When the user clicks "Go & Comment", we navigate to the post's URL.
// On page load, check if there's a pending comment to auto-fill.

async function checkPendingComment() {
  if (!location.pathname.startsWith("/feed/update/")) return;

  try {
    const result = await chrome.storage.session.get("pendingComment");
    const pending = result?.pendingComment;
    if (!pending || !pending.text) return;

    // Check if this page matches the pending post URN
    const currentUrl = location.href;
    const urnMatch = pending.urn && currentUrl.includes(
      pending.urn.replace("urn:li:activity:", "")
    );

    if (!urnMatch && pending.urn) return; // wrong post page

    console.log(`${LOG_PREFIX} Pending comment found — auto-filling...`);

    // Wait for the page to fully render
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const result2 = await fillCommentForPost(null, pending.text);
    if (result2.ok) {
      console.log(`${LOG_PREFIX} Auto-fill successful!`);
      // Clear the pending comment
      await chrome.storage.session.remove("pendingComment");
      // Notify the background that fill was successful
      chrome.runtime.sendMessage({
        type: "AUTO_FILL_COMPLETE",
        urn: pending.urn,
        success: true,
      });
    } else {
      console.warn(`${LOG_PREFIX} Auto-fill failed: ${result2.reason}`);
    }
  } catch (err) {
    console.error(`${LOG_PREFIX} checkPendingComment error:`, err);
  }
}

// ── MutationObserver (DOM fallback scanner) ──────────────────────────────────

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

// ── Message Handlers ────────────────────────────────────────────────────────

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

  // NEW: Fill AI-generated comment
  if (message?.type === "FILL_AI_COMMENT") {
    fillCommentForPost(message.urn, message.text)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, reason: String(err) }));
    return true;
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

  // NEW: Start auto-scroll from popup/panel
  if (message?.type === "START_SCAN") {
    const mode = message.mode || "auto";
    if (mode === "auto") {
      startAutoScroll(message.batches || 10);
    }
    sendResponse({ ok: true, currentPosts: postCache.size });
    return false;
  }

  // NEW: Stop auto-scroll
  if (message?.type === "STOP_SCAN") {
    stopAutoScroll();
    sendResponse({ ok: true });
    return false;
  }

  // NEW: Get current post count + status
  if (message?.type === "GET_SCAN_STATUS") {
    sendResponse({
      ok: true,
      total: postCache.size,
      hasCsrf: !!capturedCsrfToken,
    });
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
  startAutoScroll,
  stopAutoScroll,
  TEST_COMMENT,
};

// ── Init ────────────────────────────────────────────────────────────────────

window.addEventListener("load", () => {
  setTimeout(() => {
    scanFeedNow();
    startFeedObserver();
    checkPendingComment(); // auto-fill if we landed on a direct post URL
  }, 1500);
});
