// Shadow DOM panel injected into LinkedIn pages (v3).
// Loaded after content.js, so window.LI_FEED is available.
//
// Flow (no AI):
//   1. Idle      — waiting for user to scan / scroll
//   2. Scanning  — auto-scroll in progress, shows progress bar
//   3. Posts     — lists captured posts; each has a text box where the user
//                  writes their own comment and a button that posts it
//                  directly to LinkedIn via the user's own session.
//
// Posts are fetched entirely client-side by the network spy — no backend.

const PANEL_HOST_ID = "__li_assistant_panel_host__";
const PANEL_STORAGE_KEY = "li_assistant_panel_visible";

function panelStyles() {
  return `
    :host {
      all: initial;
      position: fixed;
      top: 80px;
      right: 16px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1f2937;
    }
    .panel {
      width: 380px;
      max-height: 78vh;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel.hidden { display: none; }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px;
      background: linear-gradient(135deg, #0a66c2 0%, #0052a3 100%);
      color: #ffffff;
    }
    .title { font-size: 13px; font-weight: 600; letter-spacing: 0.2px; }
    .badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 500;
    }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .close-btn {
      flex: 0 0 auto;
      background: transparent;
      color: #ffffff;
      border: none;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      padding: 0 4px;
      opacity: 0.8;
    }
    .close-btn:hover { opacity: 1; }

    .actions-bar {
      display: flex;
      gap: 6px;
      padding: 8px 14px;
      border-bottom: 1px solid #f3f4f6;
      background: #f9fafb;
    }
    button {
      padding: 6px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #ffffff;
      color: #1f2937;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }
    button:hover { background: #f3f4f6; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary {
      background: #0a66c2;
      color: #ffffff;
      border-color: #0a66c2;
      font-weight: 600;
    }
    button.primary:hover { background: #084d94; }
    button.success { background: #22c55e; color: #ffffff; border-color: #22c55e; }

    .content { overflow-y: auto; flex: 1; }

    .state-idle {
      padding: 32px 14px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.5;
    }
    .state-idle .emoji { font-size: 28px; margin-bottom: 8px; }

    .state-scanning { padding: 32px 14px; text-align: center; }
    .state-scanning .emoji { font-size: 28px; margin-bottom: 8px; }
    .scan-label { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
    .progress-bar {
      width: 100%;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #0a66c2, #22c55e);
      border-radius: 3px;
      transition: width 0.3s ease;
      width: 0%;
    }
    .scan-count { font-size: 12px; color: #9ca3af; }

    .post-row {
      padding: 12px 14px;
      border-bottom: 1px solid #f3f4f6;
    }
    .post-row:last-child { border-bottom: none; }
    .post-row.done { opacity: 0.55; background: #f9fafb; }

    .post-author { font-weight: 600; font-size: 12px; color: #111827; }
    .post-headline {
      font-size: 10px;
      color: #9ca3af;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .post-text {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .no-text { font-style: italic; color: #c0c4cc; }

    .comment-edit {
      width: 100%;
      min-height: 54px;
      padding: 8px;
      border: 1px solid #93c5fd;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      margin-bottom: 6px;
      box-sizing: border-box;
    }
    .comment-edit:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .post-actions { display: flex; align-items: center; gap: 8px; }
    .post-status { font-size: 11px; color: #9ca3af; flex: 1; }
    .post-status.ok { color: #16a34a; }
    .post-status.err { color: #dc2626; }

    .toggle-tab {
      position: absolute;
      top: 0;
      left: -28px;
      width: 28px;
      height: 60px;
      background: #0a66c2;
      color: #ffffff;
      border: none;
      border-radius: 6px 0 0 6px;
      cursor: pointer;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .toggle-tab:hover { background: #084d94; }
  `;
}

// ── Build Panel DOM ─────────────────────────────────────────────────────────

function buildPanelTree(shadow) {
  shadow.innerHTML = `
    <style>${panelStyles()}</style>
    <button class="toggle-tab" data-action="toggle">PANEL</button>
    <div class="panel" data-role="panel">
      <div class="header">
        <span class="title">LinkedIn Assistant</span>
        <div class="header-right">
          <span class="badge" data-role="count">0 posts</span>
          <button class="close-btn" data-action="close" aria-label="Close">×</button>
        </div>
      </div>
      <div class="actions-bar">
        <button data-action="refresh">↻ Refresh</button>
        <button class="primary" data-action="scan">🔍 Scan Feed</button>
      </div>
      <div class="content" data-role="content">
        <div class="state-idle">
          <div class="emoji">🎯</div>
          <p>Click <strong>Scan Feed</strong> to pull in posts, then write and post your comment on each.</p>
          <p style="font-size: 11px; margin-top: 8px;">Or just scroll your feed — posts are captured automatically. Hit <strong>Refresh</strong>.</p>
        </div>
      </div>
    </div>
  `;
}

// ── Render captured posts ─────────────────────────────────────────────────

function renderPosts(contentEl, posts) {
  const withText = posts.filter((p) => p.text && p.text.trim());

  if (!withText.length) {
    contentEl.innerHTML = `
      <div class="state-idle">
        <div class="emoji">🤔</div>
        <p>No posts with readable text captured yet. Scroll your feed a bit, then hit Refresh.</p>
      </div>`;
    return;
  }

  contentEl.innerHTML = withText
    .map((p) => {
      const urn = escapeAttr(p.postId || "");
      const author = escapeHtml(p.author || "Unknown");
      const headline = escapeHtml(p.headline || "");
      const text = escapeHtml((p.text || "").slice(0, 300));
      return `
        <div class="post-row" data-urn="${urn}">
          <div class="post-author">${author}</div>
          ${headline ? `<div class="post-headline">${headline}</div>` : ""}
          <div class="post-text">${text}</div>
          <textarea class="comment-edit" data-role="comment" placeholder="Write your comment…"></textarea>
          <div class="post-actions">
            <span class="post-status" data-role="status"></span>
            <button class="primary" data-action="post-comment" data-urn="${urn}">Post to LinkedIn</button>
          </div>
        </div>`;
    })
    .join("");
}

function renderScanning(contentEl, postCount, progress) {
  const pct = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  contentEl.innerHTML = `
    <div class="state-scanning">
      <div class="emoji">🔍</div>
      <div class="scan-label">Scanning your feed…</div>
      <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
      <div class="scan-count">${postCount} posts captured</div>
    </div>`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s) {
  return escapeHtml(s);
}

// ── Create & Wire Panel ─────────────────────────────────────────────────────

function createPanel() {
  if (document.getElementById(PANEL_HOST_ID)) return;

  const host = document.createElement("div");
  host.id = PANEL_HOST_ID;
  host.style.cssText =
    "all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;";

  const shadow = host.attachShadow({ mode: "open" });
  buildPanelTree(shadow);
  document.documentElement.appendChild(host);

  const panelEl = shadow.querySelector('[data-role="panel"]');
  const countEl = shadow.querySelector('[data-role="count"]');
  const contentEl = shadow.querySelector('[data-role="content"]');

  let currentState = "idle"; // idle | scanning | posts

  function postCount() {
    return window.LI_FEED?.getCachedPosts?.()?.length || 0;
  }

  function setState(state, data) {
    currentState = state;
    switch (state) {
      case "idle":
        countEl.textContent = `${postCount()} posts`;
        contentEl.innerHTML = `
          <div class="state-idle">
            <div class="emoji">🎯</div>
            <p>Click <strong>Scan Feed</strong> to pull in posts, then write and post your comment on each.</p>
          </div>`;
        break;
      case "scanning":
        countEl.textContent = `${postCount()} captured`;
        renderScanning(contentEl, postCount(), data);
        break;
      case "posts": {
        const posts = data || window.LI_FEED?.getCachedPosts?.() || [];
        const withText = posts.filter((p) => p.text && p.text.trim());
        countEl.textContent = `${withText.length} posts`;
        renderPosts(contentEl, posts);
        break;
      }
    }
  }

  // Show whatever's already captured (posts accumulate as the user scrolls).
  function showCapturedPosts() {
    setState("posts", window.LI_FEED?.getCachedPosts?.() || []);
  }

  // ── Scan flow (auto-scroll to capture, then list) ─────────────────────
  async function scanFeed() {
    setState("scanning", { current: 0, total: 10 });
    window.LI_FEED?.startAutoScroll?.(10);

    await new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        if (unsubscribe) unsubscribe();
        clearTimeout(timeout);
        resolve();
      };
      const timeout = setTimeout(done, 30000);
      const unsubscribe = window.LI_FEED?.onPostsChanged?.((delta) => {
        if (delta.scrollProgress !== undefined) {
          setState("scanning", {
            current: delta.scrollProgress,
            total: delta.scrollTotal || 10,
          });
        }
        if (delta.scrollComplete || postCount() >= 90) done();
      });
    });

    showCapturedPosts();
  }

  // ── Event delegation ──────────────────────────────────────────────────
  shadow.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const urn = btn.dataset.urn;

    if (action === "toggle") { setVisible(!isVisible()); return; }
    if (action === "close") { setVisible(false); return; }
    if (action === "scan") { scanFeed(); return; }
    if (action === "refresh") { showCapturedPosts(); return; }

    if (action === "post-comment" && urn) {
      const row = btn.closest(".post-row");
      const textarea = row?.querySelector('[data-role="comment"]');
      const statusEl = row?.querySelector('[data-role="status"]');
      const text = (textarea?.value || "").trim();

      if (!text) {
        if (statusEl) {
          statusEl.textContent = "Write a comment first";
          statusEl.className = "post-status err";
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = "Posting…";
      if (statusEl) { statusEl.textContent = ""; statusEl.className = "post-status"; }

      try {
        const result = await window.LI_FEED?.submitCommentViaApi?.(urn, text);
        if (result?.ok) {
          btn.textContent = "✓ Posted";
          btn.classList.add("success");
          if (textarea) textarea.disabled = true;
          if (statusEl) {
            statusEl.textContent = "Comment posted";
            statusEl.className = "post-status ok";
          }
          row.classList.add("done");
        } else {
          console.warn("[LinkedIn Assistant] post failed:", result);
          btn.disabled = false;
          btn.textContent = "Post to LinkedIn";
          if (statusEl) {
            statusEl.textContent =
              result?.error === "no_csrf_token"
                ? "Scroll the feed once, then retry"
                : "Failed — see console";
            statusEl.className = "post-status err";
          }
        }
      } catch (err) {
        console.error("[LinkedIn Assistant] post error:", err);
        btn.disabled = false;
        btn.textContent = "Post to LinkedIn";
        if (statusEl) {
          statusEl.textContent = "Error — see console";
          statusEl.className = "post-status err";
        }
      }
      return;
    }
  });

  // ── Visibility ────────────────────────────────────────────────────────
  function setVisible(visible) {
    panelEl.classList.toggle("hidden", !visible);
    try { localStorage.setItem(PANEL_STORAGE_KEY, visible ? "1" : "0"); } catch {}
  }
  function isVisible() { return !panelEl.classList.contains("hidden"); }

  // Keep the count badge current while idle/scanning (don't clobber typed text
  // while the user is on the posts list).
  window.LI_FEED?.onPostsChanged?.(() => {
    if (currentState === "idle" || currentState === "scanning") {
      countEl.textContent = `${postCount()} posts`;
    }
  });

  let initialVisible = true;
  try {
    if (localStorage.getItem(PANEL_STORAGE_KEY) === "0") initialVisible = false;
  } catch {}
  setVisible(initialVisible);

  // If posts were already captured before the panel opened, show them.
  if (postCount() > 0) showCapturedPosts();

  window.LI_PANEL = {
    toggle: () => { setVisible(!isVisible()); return isVisible(); },
    show: () => { setVisible(true); return true; },
    hide: () => { setVisible(false); return false; },
    refresh: showCapturedPosts,
  };
}

if (document.body) {
  createPanel();
} else {
  window.addEventListener("DOMContentLoaded", createPanel, { once: true });
}
