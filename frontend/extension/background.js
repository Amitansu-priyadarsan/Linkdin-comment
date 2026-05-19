// MV3 service worker. Handles things the popup and content script cannot:
//   - reading LinkedIn cookies (cookies API is not exposed to page contexts)
//   - acting as a message hub between popup ↔ content script when needed
//
// The popup talks to this worker via chrome.runtime.sendMessage(...).

const LINKEDIN_DOMAIN = ".linkedin.com";
const AUTH_COOKIE_NAMES = ["li_at", "JSESSIONID"];

async function isLoggedInToLinkedIn() {
  // chrome.cookies.getAll returns cookies across all subdomains when we
  // pass a domain string (matches "*.linkedin.com").
  const cookies = await chrome.cookies.getAll({ domain: LINKEDIN_DOMAIN });

  const found = {};
  for (const name of AUTH_COOKIE_NAMES) {
    found[name] = cookies.some((c) => c.name === name && c.value);
  }

  // `li_at` is the real auth cookie. JSESSIONID alone exists for logged-out
  // users too, so we require li_at.
  const loggedIn = found["li_at"] === true;
  return { loggedIn, cookiesFound: found };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CHECK_LINKEDIN_LOGIN") {
    isLoggedInToLinkedIn()
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // keep the message channel open for async sendResponse
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[LinkedIn Comment Assistant] background service worker installed");
});
