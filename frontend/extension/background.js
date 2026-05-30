// MV3 service worker (v2). Handles:
//   - reading LinkedIn cookies (cookies API is not exposed to page contexts)
//   - proxying AI comment generation requests to the FastAPI backend
//   - opening direct post URLs for "Go & Comment" navigation
//   - storing/retrieving user profile settings
//
// The popup, panel, and content script talk to this worker via
// chrome.runtime.sendMessage(...).

const LINKEDIN_DOMAIN = ".linkedin.com";
const AUTH_COOKIE_NAMES = ["li_at", "JSESSIONID"];
const DEFAULT_BACKEND_URL = "http://localhost:8000";

// ── LinkedIn Login Check ────────────────────────────────────────────────────

async function isLoggedInToLinkedIn() {
  const cookies = await chrome.cookies.getAll({ domain: LINKEDIN_DOMAIN });
  const found = {};
  for (const name of AUTH_COOKIE_NAMES) {
    found[name] = cookies.some((c) => c.name === name && c.value);
  }
  const loggedIn = found["li_at"] === true;
  return { loggedIn, cookiesFound: found };
}

// ── Backend Communication ───────────────────────────────────────────────────

async function getBackendUrl() {
  const data = await chrome.storage.local.get("backendUrl");
  return data.backendUrl || DEFAULT_BACKEND_URL;
}

async function callBackend(endpoint, body) {
  const baseUrl = await getBackendUrl();
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "unknown error");
    throw new Error(`Backend ${response.status}: ${errorText}`);
  }
  return response.json();
}

async function checkBackendHealth() {
  try {
    const baseUrl = await getBackendUrl();
    const response = await fetch(`${baseUrl}/health`, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

// ── Message Router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message?.type) return false;

  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, _sender)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // async
  }

  return false;
});

const messageHandlers = {
  // ── Existing ────────────────────────────────────────────────────────────

  CHECK_LINKEDIN_LOGIN: async () => {
    const result = await isLoggedInToLinkedIn();
    return { ok: true, ...result };
  },

  // ── Status ──────────────────────────────────────────────────────────────

  GET_STATUS: async () => {
    const loginResult = await isLoggedInToLinkedIn();
    const backendUp = await checkBackendHealth();
    const settings = await chrome.storage.local.get([
      "backendUrl",
      "userTopics",
      "userRole",
      "userGoal",
      "userAvoid",
      "scanMode",
    ]);
    return {
      ok: true,
      ...loginResult,
      backendUp,
      backendUrl: settings.backendUrl || DEFAULT_BACKEND_URL,
      userProfile: {
        topics: settings.userTopics || "",
        role: settings.userRole || "",
        goal: settings.userGoal || "",
        avoid: settings.userAvoid || "",
      },
      scanMode: settings.scanMode || "auto",
    };
  },

  // ── AI: Score + Generate ────────────────────────────────────────────────

  SCORE_AND_GENERATE: async (message) => {
    const { posts } = message;
    const settings = await chrome.storage.local.get([
      "userTopics",
      "userRole",
      "userGoal",
      "userAvoid",
    ]);

    const data = await callBackend("/api/score-posts", {
      posts: posts.map((p) => ({
        urn: p.postId || p.urn,
        text: p.text || null,
        author: p.author || null,
        headline: p.headline || null,
        social_counts: p.socialCounts || null,
      })),
      user_context: {
        topics: settings.userTopics || "general business",
        role: settings.userRole || "a professional",
        goal: settings.userGoal || "networking and visibility",
        avoid: settings.userAvoid || "",
        tone: message.tone || "professional",
      },
    });

    // Store recommendations for panel access
    await chrome.storage.session.set({
      recommendations: data.recommendations || [],
      lastScoredAt: Date.now(),
    });

    return { ok: true, recommendations: data.recommendations || [] };
  },

  // ── AI: Generate Single Comment ─────────────────────────────────────────

  GENERATE_COMMENT: async (message) => {
    const { postText, author, tone } = message;
    const data = await callBackend("/api/generate-comment", {
      post_text: postText,
      author: author || null,
      tone: tone || "professional",
    });
    return { ok: true, comments: data.comments || [] };
  },

  // ── Navigation: Go To Post ──────────────────────────────────────────────

  GO_TO_POST: async (message) => {
    const { urn, commentText } = message;

    // Store the comment to auto-fill when the post page loads
    await chrome.storage.session.set({
      pendingComment: { urn, text: commentText },
    });

    // Build the direct post URL
    const postUrl = `https://www.linkedin.com/feed/update/${urn}/`;

    // Open in a new tab
    await chrome.tabs.create({ url: postUrl, active: true });

    return { ok: true };
  },

  // ── Post Done Tracking ──────────────────────────────────────────────────

  AUTO_FILL_COMPLETE: async (message) => {
    const { urn } = message;
    // Mark this post as "done" in the recommendations
    const data = await chrome.storage.session.get("recommendations");
    const recs = data.recommendations || [];
    const updated = recs.map((r) =>
      r.urn === urn ? { ...r, done: true } : r
    );
    await chrome.storage.session.set({ recommendations: updated });
    return { ok: true };
  },

  MARK_POST_DONE: async (message) => {
    const { urn } = message;
    const data = await chrome.storage.session.get("recommendations");
    const recs = data.recommendations || [];
    const updated = recs.map((r) =>
      r.urn === urn ? { ...r, done: true } : r
    );
    await chrome.storage.session.set({ recommendations: updated });
    return { ok: true };
  },

  // ── Settings ────────────────────────────────────────────────────────────

  SAVE_SETTINGS: async (message) => {
    const { backendUrl, userTopics, userRole, userGoal, userAvoid, scanMode } =
      message;
    const updates = {};
    if (backendUrl !== undefined) updates.backendUrl = backendUrl;
    if (userTopics !== undefined) updates.userTopics = userTopics;
    if (userRole !== undefined) updates.userRole = userRole;
    if (userGoal !== undefined) updates.userGoal = userGoal;
    if (userAvoid !== undefined) updates.userAvoid = userAvoid;
    if (scanMode !== undefined) updates.scanMode = scanMode;
    await chrome.storage.local.set(updates);
    return { ok: true };
  },

  // ── Recommendations Retrieval ───────────────────────────────────────────

  GET_RECOMMENDATIONS: async () => {
    const data = await chrome.storage.session.get([
      "recommendations",
      "lastScoredAt",
    ]);
    return {
      ok: true,
      recommendations: data.recommendations || [],
      lastScoredAt: data.lastScoredAt || null,
    };
  },
};

// ── Install Event ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log(
    "[LinkedIn Comment Assistant] background service worker installed (v2)"
  );
});
