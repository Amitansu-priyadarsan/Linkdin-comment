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
    const settings = await chrome.storage.local.get(["backendUrl", "scanMode"]);
    return {
      ok: true,
      ...loginResult,
      backendUp,
      backendUrl: settings.backendUrl || DEFAULT_BACKEND_URL,
      scanMode: settings.scanMode || "auto",
    };
  },

  // ── Settings ────────────────────────────────────────────────────────────

  SAVE_SETTINGS: async (message) => {
    const { backendUrl, scanMode } = message;
    const updates = {};
    if (backendUrl !== undefined) updates.backendUrl = backendUrl;
    if (scanMode !== undefined) updates.scanMode = scanMode;
    await chrome.storage.local.set(updates);
    return { ok: true };
  },
};

// ── Install Event ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log(
    "[LinkedIn Comment Assistant] background service worker installed (v2)"
  );
});
