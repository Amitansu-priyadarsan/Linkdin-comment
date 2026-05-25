// Shadow DOM debug panel injected into LinkedIn pages.
// Loaded after content.js, so window.LI_FEED is available.
//
// Why Shadow DOM:
//   - LinkedIn's CSS is heavy and aggressive. A normal <div> on the page
//     inherits or collides with their resets. A shadow root gives us a
//     completely isolated style scope.
//   - We can ship the panel's CSS as a <style> inside the root and know
//     LinkedIn cannot override it.
//
// Panel actions:
//   - List detected posts (most recent first)
//   - Hover row → highlight the corresponding feed post
//   - "Fill" button → open comment editor for that specific post

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
      width: 340px;
      max-height: 70vh;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel.hidden { display: none; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      background: linear-gradient(180deg, #0a66c2 0%, #084d94 100%);
      color: #ffffff;
    }
    .title { font-size: 13px; font-weight: 600; letter-spacing: 0.2px; }
    .badge {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 500;
    }
    .actions {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      border-bottom: 1px solid #f3f4f6;
      background: #fafafa;
    }
    button {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: #ffffff;
      color: #1f2937;
      font-size: 12px;
      cursor: pointer;
    }
    button:hover { background: #f3f4f6; }
    button.primary {
      background: #0a66c2;
      color: #ffffff;
      border-color: #0a66c2;
    }
    button.primary:hover { background: #084d94; }
    .list {
      overflow-y: auto;
      flex: 1;
    }
    .row {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background 0.1s;
    }
    .row:hover { background: #f9fafb; }
    .row-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }
    .author { font-weight: 600; font-size: 12px; color: #111827; }
    .urn { font-size: 10px; color: #9ca3af; font-family: ui-monospace, monospace; }
    .text {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .row-actions {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }
    .row-actions button {
      flex: 0 0 auto;
      padding: 3px 8px;
      font-size: 11px;
    }
    .empty {
      padding: 24px 12px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    .close-btn {
      flex: 0 0 auto;
      background: transparent;
      color: #ffffff;
      border: none;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 0 4px;
    }
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
  `;
}

function buildPanelTree(shadow) {
  shadow.innerHTML = `
    <style>${panelStyles()}</style>
    <button class="toggle-tab" data-action="toggle">PANEL</button>
    <div class="panel" data-role="panel">
      <div class="header">
        <span class="title">LinkedIn Assistant</span>
        <span class="badge" data-role="count">0 posts</span>
        <button class="close-btn" data-action="close" aria-label="Close">×</button>
      </div>
      <div class="actions">
        <button data-action="rescan">Re-scan now</button>
        <button class="primary" data-action="fill-first">Fill first post</button>
      </div>
      <div class="list" data-role="list">
        <div class="empty">Scroll the LinkedIn feed and posts will appear here.</div>
      </div>
    </div>
  `;
}

function renderRows(listEl, posts) {
  if (!posts.length) {
    listEl.innerHTML = `<div class="empty">No posts detected yet. Scroll the feed.</div>`;
    return;
  }
  const html = posts.slice(0, 50).map((p) => {
    const urnShort = (p.postId || "").replace("urn:li:activity:", "").slice(0, 14);
    const author = escapeHtml(p.author || "Unknown");
    const text = escapeHtml(p.text || "(no text)");
    const urnAttr = escapeAttr(p.postId || "");
    return `
      <div class="row" data-urn="${urnAttr}">
        <div class="row-head">
          <span class="author">${author}</span>
          <span class="urn">${urnShort}</span>
        </div>
        <div class="text">${text}</div>
        <div class="row-actions">
          <button data-action="highlight" data-urn="${urnAttr}">Highlight</button>
          <button class="primary" data-action="fill" data-urn="${urnAttr}">Fill comment</button>
        </div>
      </div>
    `;
  }).join("");
  listEl.innerHTML = html;
}

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

function createPanel() {
  if (document.getElementById(PANEL_HOST_ID)) return; // already injected

  const host = document.createElement("div");
  host.id = PANEL_HOST_ID;
  // Host must be inert layout-wise except for its shadow content. The shadow
  // root uses `position: fixed` via `:host`, so the host itself can stay 0×0.
  host.style.cssText = "all: initial; position: fixed; top: 0; right: 0; z-index: 2147483647;";

  const shadow = host.attachShadow({ mode: "open" });
  buildPanelTree(shadow);
  document.documentElement.appendChild(host);

  const panelEl = shadow.querySelector('[data-role="panel"]');
  const countEl = shadow.querySelector('[data-role="count"]');
  const listEl = shadow.querySelector('[data-role="list"]');

  function refresh() {
    const posts = window.LI_FEED?.getCachedPosts?.() || [];
    countEl.textContent = `${posts.length} post${posts.length === 1 ? "" : "s"}`;
    renderRows(listEl, posts);
  }

  function setVisible(visible) {
    panelEl.classList.toggle("hidden", !visible);
    try { localStorage.setItem(PANEL_STORAGE_KEY, visible ? "1" : "0"); } catch { /* ignore */ }
  }

  function isVisible() {
    return !panelEl.classList.contains("hidden");
  }

  // Event delegation — one listener for everything inside the shadow root.
  shadow.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const urn = btn.dataset.urn;

    if (action === "toggle") { setVisible(!isVisible()); return; }
    if (action === "close")  { setVisible(false); return; }

    if (action === "rescan") {
      window.LI_FEED?.scanFeedNow();
      refresh();
      return;
    }

    if (action === "fill-first") {
      const res = await window.LI_FEED?.fillCommentForPost(null);
      flashStatus(btn, res?.ok ? "Filled" : res?.reason || "failed");
      return;
    }

    if (action === "highlight" && urn) {
      window.LI_FEED?.highlightPost(urn);
      return;
    }

    if (action === "fill" && urn) {
      const res = await window.LI_FEED?.fillCommentForPost(urn);
      flashStatus(btn, res?.ok ? "Filled" : res?.reason || "failed");
      return;
    }
  });

  // Hover a row → highlight that post in the feed.
  shadow.addEventListener("mouseover", (e) => {
    const row = e.target.closest(".row");
    if (!row) return;
    const urn = row.dataset.urn;
    if (urn) window.LI_FEED?.highlightPost(urn);
  });

  function flashStatus(btn, msg) {
    const original = btn.textContent;
    btn.textContent = msg;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1500);
  }

  // Subscribe to feed updates.
  window.LI_FEED?.onPostsChanged?.(refresh);

  // Restore last visibility (default = visible).
  let initialVisible = true;
  try {
    const stored = localStorage.getItem(PANEL_STORAGE_KEY);
    if (stored === "0") initialVisible = false;
  } catch { /* ignore */ }
  setVisible(initialVisible);

  refresh();

  // Expose toggle for the popup ("Show / hide panel" button).
  window.LI_PANEL = {
    toggle: () => { setVisible(!isVisible()); return isVisible(); },
    show:   () => { setVisible(true); return true; },
    hide:   () => { setVisible(false); return false; },
    refresh,
  };
}

// Wait for body before injecting. document_idle gives us body already, but
// belt-and-suspenders for slow first paint.
if (document.body) {
  createPanel();
} else {
  window.addEventListener("DOMContentLoaded", createPanel, { once: true });
}
