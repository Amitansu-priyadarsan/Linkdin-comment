// Popup script — runs only while the popup is open.
// Talks to:
//   - background.js (chrome.runtime.sendMessage) for cookie-based login check
//   - content.js    (chrome.tabs.sendMessage) for DOM scan + comment fill

const loginDot = document.getElementById("login-dot");
const loginText = document.getElementById("login-text");
const scanBtn = document.getElementById("scan-feed-btn");
const commentBtn = document.getElementById("post-comment-btn");
const logOutput = document.getElementById("log-output");

function logLine(line) {
  const ts = new Date().toLocaleTimeString();
  logOutput.textContent = `[${ts}] ${line}\n` + logOutput.textContent;
}

async function getActiveLinkedInTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.startsWith("https://www.linkedin.com/")) {
    return null;
  }
  return tab;
}

async function checkLogin() {
  loginDot.dataset.state = "unknown";
  loginText.textContent = "Checking LinkedIn login…";
  try {
    const res = await chrome.runtime.sendMessage({ type: "CHECK_LINKEDIN_LOGIN" });
    if (res?.ok && res.loggedIn) {
      loginDot.dataset.state = "ok";
      loginText.textContent = "Logged in to LinkedIn";
    } else {
      loginDot.dataset.state = "warn";
      loginText.textContent = "Not logged in — open linkedin.com and sign in";
    }
  } catch (err) {
    loginDot.dataset.state = "warn";
    loginText.textContent = "Could not check login";
    logLine(`login check failed: ${err.message || err}`);
  }
}

scanBtn.addEventListener("click", async () => {
  const tab = await getActiveLinkedInTab();
  if (!tab) {
    logLine("Open a LinkedIn tab first (https://www.linkedin.com/feed/).");
    return;
  }
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_FEED" });
    if (res?.ok) {
      logLine(`Found ${res.posts.length} posts. Check the page DevTools console for details.`);
    } else {
      logLine("Scan returned no result.");
    }
  } catch (err) {
    logLine(`scan failed: ${err.message || err}`);
  }
});

commentBtn.addEventListener("click", async () => {
  const tab = await getActiveLinkedInTab();
  if (!tab) {
    logLine("Open a LinkedIn tab first (https://www.linkedin.com/feed/).");
    return;
  }
  commentBtn.disabled = true;
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "FILL_TEST_COMMENT" });
    if (res?.ok) {
      logLine("Test comment filled. Review the text, then click LinkedIn's Post button.");
    } else {
      logLine(`could not fill comment: ${res?.reason || "unknown"}`);
    }
  } catch (err) {
    logLine(`message failed: ${err.message || err}`);
  } finally {
    commentBtn.disabled = false;
  }
});

document.addEventListener("DOMContentLoaded", checkLogin);
