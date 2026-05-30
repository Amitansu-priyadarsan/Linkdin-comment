// Shadow DOM panel injected into LinkedIn pages (v2).
// Loaded after content.js, so window.LI_FEED is available.
//
// Three states:
//   1. Idle       — waiting for user to scan
//   2. Scanning   — auto-scroll in progress, shows progress bar
//   3. Recommend  — shows AI-picked posts with pre-generated comments
//
// Panel actions:
//   - "Go & Comment" → opens post in new tab with auto-fill
//   - "Edit" → inline edit the AI comment before filling
//   - "Skip" → remove from recommendations
//   - "Re-scan" → trigger new scan cycle

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
      width: 360px;
      max-height: 75vh;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .panel.hidden { display: none; }

    /* Header */
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
    .badge.done-badge {
      background: rgba(34, 197, 94, 0.3);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
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

    /* Actions bar */
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
    button.success {
      background: #22c55e;
      color: #ffffff;
      border-color: #22c55e;
    }

    /* Content / list */
    .content {
      overflow-y: auto;
      flex: 1;
    }

    /* Idle state */
    .state-idle {
      padding: 32px 14px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
      line-height: 1.5;
    }
    .state-idle .emoji { font-size: 28px; margin-bottom: 8px; }

    /* Scanning state */
    .state-scanning {
      padding: 32px 14px;
      text-align: center;
    }
    .state-scanning .emoji { font-size: 28px; margin-bottom: 8px; }
    .scan-label {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
    }
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
    .scan-count {
      font-size: 12px;
      color: #9ca3af;
    }

    /* Recommendation row */
    .rec-row {
      padding: 12px 14px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }
    .rec-row:last-child { border-bottom: none; }
    .rec-row.done { opacity: 0.5; background: #f9fafb; }

    .rec-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .score {
      font-size: 11px;
      font-weight: 700;
      color: #0a66c2;
      background: #eff6ff;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .score.high { color: #15803d; background: #f0fdf4; }
    .reason {
      font-size: 10px;
      color: #9ca3af;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .done-label {
      font-size: 10px;
      color: #22c55e;
      font-weight: 600;
    }

    .rec-author {
      font-weight: 600;
      font-size: 12px;
      color: #111827;
      margin-bottom: 2px;
    }
    .rec-text {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 8px;
    }

    /* Comment preview */
    .comment-preview {
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 8px;
    }
    .comment-label {
      font-size: 10px;
      color: #3b82f6;
      font-weight: 600;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .comment-text {
      font-size: 12px;
      color: #1e40af;
      line-height: 1.4;
    }

    /* Edit textarea */
    .comment-edit {
      width: 100%;
      min-height: 60px;
      padding: 8px;
      border: 1px solid #93c5fd;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      margin-bottom: 8px;
      box-sizing: border-box;
    }
    .comment-edit:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    /* Row actions */
    .rec-actions {
      display: flex;
      gap: 6px;
    }
    .rec-actions button {
      flex: 0 0 auto;
      padding: 4px 10px;
      font-size: 11px;
    }

    /* Toggle tab */
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
        <button data-action="rescan">Re-scan</button>
        <button class="primary" data-action="scan-and-score">🔍 Scan & Score</button>
      </div>
      <div class="content" data-role="content">
        <div class="state-idle">
          <div class="emoji">🎯</div>
          <p>Click <strong>Scan & Score</strong> to find the best posts to comment on.</p>
          <p style="font-size: 11px; margin-top: 8px;">Or scroll your feed — posts are captured automatically.</p>
        </div>
      </div>
    </div>
  `;
}

// ── Render Recommendations ──────────────────────────────────────────────────

function renderRecommendations(contentEl, recommendations) {
  if (!recommendations || !recommendations.length) {
    contentEl.innerHTML = `
      <div class="state-idle">
        <div class="emoji">🤔</div>
        <p>No posts scored yet. Try scanning again or scroll more of your feed.</p>
      </div>
    `;
    return;
  }

  const html = recommendations
    .map((rec) => {
      const urn = escapeAttr(rec.urn || "");
      const author = escapeHtml(rec.author || "Unknown");
      const textPreview = escapeHtml(rec.text_preview || rec.textPreview || "(no text)");
      const comment = escapeHtml(rec.comment || "");
      const score = rec.score || 0;
      const reason = escapeHtml(rec.reason || "");
      const isDone = rec.done === true;
      const scoreClass = score >= 8 ? "high" : "";

      return `
        <div class="rec-row ${isDone ? "done" : ""}" data-urn="${urn}">
          <div class="rec-meta">
            <span class="score ${scoreClass}">★ ${score}/10</span>
            <span class="reason">${reason}</span>
            ${isDone ? '<span class="done-label">✓ Done</span>' : ""}
          </div>
          <div class="rec-author">${author}</div>
          <div class="rec-text">${textPreview}</div>
          <div class="comment-preview" data-role="comment-preview">
            <div class="comment-label">💬 AI Comment</div>
            <div class="comment-text">${comment}</div>
          </div>
          <div class="rec-actions">
            ${
              isDone
                ? ""
                : `
              <button data-action="edit" data-urn="${urn}">✏ Edit</button>
              <button class="primary" data-action="go-comment" data-urn="${urn}" data-comment="${escapeAttr(rec.comment || "")}">
                Go & Comment ▶
              </button>
              <button data-action="skip" data-urn="${urn}">Skip</button>
            `
            }
          </div>
        </div>
      `;
    })
    .join("");

  contentEl.innerHTML = html;
}

function renderScanning(contentEl, postCount, progress) {
  const pct = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  contentEl.innerHTML = `
    <div class="state-scanning">
      <div class="emoji">🔍</div>
      <div class="scan-label">Scanning your feed...</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${pct}%"></div>
      </div>
      <div class="scan-count">${postCount} posts captured</div>
    </div>
  `;
}

function renderAnalyzing(contentEl, postCount) {
  contentEl.innerHTML = `
    <div class="state-scanning">
      <div class="emoji">🧠</div>
      <div class="scan-label">AI is scoring ${postCount} posts...</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 60%; animation: pulse 1.5s infinite;"></div>
      </div>
      <div class="scan-count">Finding the best posts to comment on</div>
    </div>
  `;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function flashStatus(btn, msg) {
  const original = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1500);
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

  let currentState = "idle"; // idle | scanning | analyzing | recommendations
  let currentRecommendations = [];
  let scanProgress = null;

  // ── State machine ───────────────────────────────────────────────────────

  function setState(state, data) {
    currentState = state;
    const postCount = window.LI_FEED?.getCachedPosts?.()?.length || 0;

    switch (state) {
      case "idle":
        countEl.textContent = `${postCount} posts`;
        contentEl.innerHTML = `
          <div class="state-idle">
            <div class="emoji">🎯</div>
            <p>Click <strong>Scan & Score</strong> to find the best posts to comment on.</p>
          </div>`;
        break;

      case "scanning":
        countEl.textContent = `${postCount} captured`;
        renderScanning(contentEl, postCount, data);
        break;

      case "analyzing":
        countEl.textContent = "Analyzing...";
        renderAnalyzing(contentEl, postCount);
        break;

      case "recommendations":
        currentRecommendations = data || [];
        const doneCount = currentRecommendations.filter((r) => r.done).length;
        const total = currentRecommendations.length;
        countEl.textContent = `${total} picks · ${doneCount} done`;
        renderRecommendations(contentEl, currentRecommendations);
        break;
    }
  }

  // ── Load saved recommendations ────────────────────────────────────────

  async function loadRecommendations() {
    try {
      const result = await chrome.runtime.sendMessage({
        type: "GET_RECOMMENDATIONS",
      });
      if (result?.recommendations?.length) {
        setState("recommendations", result.recommendations);
      }
    } catch {
      /* ignore */
    }
  }

  // ── Scan & Score flow ─────────────────────────────────────────────────

  async function scanAndScore() {
    setState("scanning", { current: 0, total: 10 });

    // Start auto-scroll
    window.LI_FEED?.startAutoScroll?.(10);

    // Wait for scroll to complete (listen for events)
    await new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, 30000); // 30s max

      const unsubscribe = window.LI_FEED?.onPostsChanged?.((delta) => {
        const postCount =
          window.LI_FEED?.getCachedPosts?.()?.length || 0;

        if (delta.scrollProgress !== undefined) {
          setState("scanning", {
            current: delta.scrollProgress,
            total: delta.scrollTotal || 10,
          });
        }

        if (delta.scrollComplete || postCount >= 90) {
          clearTimeout(timeout);
          if (!resolved) {
            resolved = true;
            if (unsubscribe) unsubscribe();
            resolve();
          }
        }
      });
    });

    // Get all captured posts
    const posts = window.LI_FEED?.getCachedPosts?.() || [];

    if (posts.length === 0) {
      setState("idle");
      return;
    }

    // Send to AI for scoring
    setState("analyzing");

    try {
      const result = await chrome.runtime.sendMessage({
        type: "SCORE_AND_GENERATE",
        posts,
        tone: "professional",
      });

      if (result?.ok && result.recommendations?.length) {
        setState("recommendations", result.recommendations);
      } else {
        setState("idle");
      }
    } catch (err) {
      console.error("[LinkedIn Assistant] scoring failed:", err);
      setState("idle");
    }
  }

  // ── Event delegation ──────────────────────────────────────────────────

  shadow.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    const urn = btn.dataset.urn;

    if (action === "toggle") {
      setVisible(!isVisible());
      return;
    }
    if (action === "close") {
      setVisible(false);
      return;
    }

    if (action === "rescan" || action === "scan-and-score") {
      scanAndScore();
      return;
    }

    if (action === "go-comment" && urn) {
      const comment = btn.dataset.comment || "";
      btn.disabled = true;
      btn.textContent = "Opening...";

      try {
        await chrome.runtime.sendMessage({
          type: "GO_TO_POST",
          urn,
          commentText: comment,
        });

        // Mark as done after a brief delay
        setTimeout(async () => {
          await chrome.runtime.sendMessage({
            type: "MARK_POST_DONE",
            urn,
          });
          // Refresh recommendations
          const result = await chrome.runtime.sendMessage({
            type: "GET_RECOMMENDATIONS",
          });
          if (result?.recommendations) {
            setState("recommendations", result.recommendations);
          }
        }, 2000);
      } catch (err) {
        flashStatus(btn, "Failed");
      }
      return;
    }

    if (action === "edit" && urn) {
      // Toggle between preview and edit mode
      const row = btn.closest(".rec-row");
      const preview = row.querySelector('[data-role="comment-preview"]');
      if (!preview) return;

      const currentText = preview.querySelector(".comment-text")?.textContent || "";

      if (btn.textContent.includes("Edit")) {
        // Switch to edit mode
        preview.innerHTML = `
          <div class="comment-label">💬 Edit Comment</div>
          <textarea class="comment-edit" data-role="edit-area">${escapeHtml(currentText)}</textarea>
          <div style="display: flex; gap: 6px;">
            <button data-action="save-edit" data-urn="${escapeAttr(urn)}" class="primary" style="flex:1">Save</button>
            <button data-action="cancel-edit" data-urn="${escapeAttr(urn)}" style="flex:1">Cancel</button>
          </div>
        `;
        btn.textContent = "✏ Editing...";
        btn.disabled = true;
      }
      return;
    }

    if (action === "save-edit" && urn) {
      const row = btn.closest(".rec-row");
      const textarea = row.querySelector('[data-role="edit-area"]');
      const newText = textarea?.value?.trim() || "";

      if (newText) {
        // Update the recommendation in storage
        const result = await chrome.runtime.sendMessage({
          type: "GET_RECOMMENDATIONS",
        });
        const recs = result?.recommendations || [];
        const updated = recs.map((r) =>
          r.urn === urn ? { ...r, comment: newText } : r
        );
        await chrome.storage.session.set({ recommendations: updated });
        setState("recommendations", updated);
      }
      return;
    }

    if (action === "cancel-edit" && urn) {
      // Re-render to restore preview mode
      const result = await chrome.runtime.sendMessage({
        type: "GET_RECOMMENDATIONS",
      });
      if (result?.recommendations) {
        setState("recommendations", result.recommendations);
      }
      return;
    }

    if (action === "skip" && urn) {
      // Remove from recommendations
      const result = await chrome.runtime.sendMessage({
        type: "GET_RECOMMENDATIONS",
      });
      const recs = (result?.recommendations || []).filter(
        (r) => r.urn !== urn
      );
      await chrome.storage.session.set({ recommendations: recs });
      setState("recommendations", recs);
      return;
    }
  });

  // ── Visibility ────────────────────────────────────────────────────────

  function setVisible(visible) {
    panelEl.classList.toggle("hidden", !visible);
    try {
      localStorage.setItem(PANEL_STORAGE_KEY, visible ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  function isVisible() {
    return !panelEl.classList.contains("hidden");
  }

  // Subscribe to feed updates — keep post count badge current
  window.LI_FEED?.onPostsChanged?.((delta) => {
    if (currentState === "idle" || currentState === "scanning") {
      const postCount =
        window.LI_FEED?.getCachedPosts?.()?.length || 0;
      countEl.textContent = `${postCount} posts`;
    }
  });

  // Restore last visibility (default = visible)
  let initialVisible = true;
  try {
    const stored = localStorage.getItem(PANEL_STORAGE_KEY);
    if (stored === "0") initialVisible = false;
  } catch {
    /* ignore */
  }
  setVisible(initialVisible);

  // Load any existing recommendations
  loadRecommendations();

  // Expose toggle for popup/content script
  window.LI_PANEL = {
    toggle: () => {
      setVisible(!isVisible());
      return isVisible();
    },
    show: () => {
      setVisible(true);
      return true;
    },
    hide: () => {
      setVisible(false);
      return false;
    },
    refresh: loadRecommendations,
  };
}

// Wait for body before injecting.
if (document.body) {
  createPanel();
} else {
  window.addEventListener("DOMContentLoaded", createPanel, { once: true });
}
