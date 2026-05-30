// Popup script (v2) — runs only while the popup is open.
// Talks to:
//   - background.js (chrome.runtime.sendMessage) for status, settings, AI
//   - content.js    (chrome.tabs.sendMessage) for DOM scan + auto-scroll

const loginDot = document.getElementById("login-dot");
const loginText = document.getElementById("login-text");
const backendDot = document.getElementById("backend-dot");
const backendText = document.getElementById("backend-text");
const scanBtn = document.getElementById("scan-btn");
const togglePanelBtn = document.getElementById("toggle-panel-btn");
const saveSettingsBtn = document.getElementById("save-settings-btn");
const logOutput = document.getElementById("log-output");
const progressContainer = document.getElementById("scan-progress");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");

// Profile fields
const topicsInput = document.getElementById("user-topics");
const roleInput = document.getElementById("user-role");
const goalInput = document.getElementById("user-goal");
const avoidInput = document.getElementById("user-avoid");
const backendUrlInput = document.getElementById("backend-url");

function logLine(line) {
  const ts = new Date().toLocaleTimeString();
  logOutput.textContent = `[${ts}] ${line}\n` + logOutput.textContent;
}

async function getActiveLinkedInTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (!tab || !tab.url || !tab.url.startsWith("https://www.linkedin.com/")) {
    return null;
  }
  return tab;
}

// ── Initialization ──────────────────────────────────────────────────────────

async function init() {
  try {
    const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });

    // Login status
    if (status?.loggedIn) {
      loginDot.dataset.state = "ok";
      loginText.textContent = "Logged in to LinkedIn";
    } else {
      loginDot.dataset.state = "warn";
      loginText.textContent = "Not logged in — open linkedin.com and sign in";
    }

    // Backend status
    if (status?.backendUp) {
      backendDot.dataset.state = "ok";
      backendText.textContent = "Backend connected";
    } else {
      backendDot.dataset.state = "warn";
      backendText.textContent = "Backend offline — check your server";
    }

    // Load profile
    if (status?.userProfile) {
      topicsInput.value = status.userProfile.topics || "";
      roleInput.value = status.userProfile.role || "";
      goalInput.value = status.userProfile.goal || "";
      avoidInput.value = status.userProfile.avoid || "";
    }

    // Load settings
    backendUrlInput.value = status?.backendUrl || "http://localhost:8000";

    // Load scan mode
    if (status?.scanMode) {
      const radio = document.querySelector(
        `input[name="scan-mode"][value="${status.scanMode}"]`
      );
      if (radio) radio.checked = true;
    }
  } catch (err) {
    loginDot.dataset.state = "warn";
    loginText.textContent = "Could not check status";
    logLine(`init failed: ${err.message || err}`);
  }
}

// ── Auto-save profile on change ─────────────────────────────────────────────

let saveTimeout = null;
function scheduleProfileSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveProfile, 800);
}

async function saveProfile() {
  try {
    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      userTopics: topicsInput.value.trim(),
      userRole: roleInput.value.trim(),
      userGoal: goalInput.value.trim(),
      userAvoid: avoidInput.value.trim(),
      scanMode: document.querySelector('input[name="scan-mode"]:checked')
        ?.value || "auto",
    });
  } catch (err) {
    logLine(`save failed: ${err.message}`);
  }
}

topicsInput.addEventListener("input", scheduleProfileSave);
roleInput.addEventListener("input", scheduleProfileSave);
goalInput.addEventListener("input", scheduleProfileSave);
avoidInput.addEventListener("input", scheduleProfileSave);
document.querySelectorAll('input[name="scan-mode"]').forEach((radio) => {
  radio.addEventListener("change", scheduleProfileSave);
});

// ── Scan & Find Posts ───────────────────────────────────────────────────────

let scanning = false;

scanBtn.addEventListener("click", async () => {
  const tab = await getActiveLinkedInTab();
  if (!tab) {
    logLine("Open a LinkedIn tab first (https://www.linkedin.com/feed/).");
    return;
  }

  if (scanning) return;
  scanning = true;
  scanBtn.disabled = true;
  scanBtn.textContent = "⏳ Scanning...";

  const mode = document.querySelector('input[name="scan-mode"]:checked')?.value || "auto";

  // Save profile before scanning
  await saveProfile();

  try {
    // Step 1: Start scanning (auto-scroll or manual)
    if (mode === "auto") {
      progressContainer.style.display = "block";
      progressFill.style.width = "0%";
      progressText.textContent = "Starting auto-scroll...";
      logLine("Starting auto-scroll to capture ~100 posts...");

      await chrome.tabs.sendMessage(tab.id, {
        type: "START_SCAN",
        mode: "auto",
        batches: 10,
      });

      // Wait for auto-scroll to complete
      await waitForScrollComplete(tab.id);
    } else {
      logLine("Manual mode: scanning currently loaded posts...");
      await chrome.tabs.sendMessage(tab.id, { type: "SCAN_FEED" });
    }

    // Step 2: Get captured posts
    const postResult = await chrome.tabs.sendMessage(tab.id, {
      type: "GET_CACHED_POSTS",
    });
    const posts = postResult?.posts || [];
    logLine(`Captured ${posts.length} posts. Sending to AI for scoring...`);

    if (posts.length === 0) {
      logLine("No posts found. Try scrolling the feed first.");
      return;
    }

    // Step 3: Score and generate via backend
    progressText.textContent = "AI is picking the best posts...";
    progressFill.style.width = "80%";

    const scoreResult = await chrome.runtime.sendMessage({
      type: "SCORE_AND_GENERATE",
      posts,
      tone: "professional",
    });

    if (scoreResult?.ok && scoreResult.recommendations?.length) {
      const count = scoreResult.recommendations.length;
      logLine(
        `✅ AI picked ${count} post${count === 1 ? "" : "s"} to comment on. Check the panel!`
      );
      progressFill.style.width = "100%";
      progressText.textContent = `${count} posts ready!`;

      // Show the panel
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
      } catch { /* panel may already be visible */ }
    } else {
      logLine(
        `AI scoring failed: ${scoreResult?.error || "no recommendations returned"}`
      );
    }
  } catch (err) {
    logLine(`scan failed: ${err.message || err}`);
  } finally {
    scanning = false;
    scanBtn.disabled = false;
    scanBtn.textContent = "🔍 Scan & Find Posts";
    setTimeout(() => {
      progressContainer.style.display = "none";
    }, 3000);
  }
});

async function waitForScrollComplete(tabId) {
  return new Promise((resolve) => {
    let pollCount = 0;
    const maxPolls = 40; // 40 * 750ms = 30 seconds max

    const poll = setInterval(async () => {
      pollCount++;
      try {
        const status = await chrome.tabs.sendMessage(tabId, {
          type: "GET_SCAN_STATUS",
        });
        const total = status?.total || 0;
        const pct = Math.min((total / 100) * 70, 70); // 0-70% for scrolling phase
        progressFill.style.width = `${pct}%`;
        progressText.textContent = `Captured ${total} posts...`;

        if (total >= 90 || pollCount >= maxPolls) {
          clearInterval(poll);
          resolve();
        }
      } catch {
        clearInterval(poll);
        resolve();
      }
    }, 750);
  });
}

// ── Toggle Panel ────────────────────────────────────────────────────────────

togglePanelBtn.addEventListener("click", async () => {
  const tab = await getActiveLinkedInTab();
  if (!tab) {
    logLine("Open a LinkedIn tab first.");
    return;
  }
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
    logLine(`Panel ${res?.visible ? "shown" : "hidden"}.`);
  } catch (err) {
    logLine(`toggle failed: ${err.message || err}`);
  }
});

// ── Save Settings ───────────────────────────────────────────────────────────

saveSettingsBtn.addEventListener("click", async () => {
  try {
    await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      backendUrl: backendUrlInput.value.trim(),
    });
    logLine("Settings saved.");
    // Re-check backend connection
    const status = await chrome.runtime.sendMessage({ type: "GET_STATUS" });
    if (status?.backendUp) {
      backendDot.dataset.state = "ok";
      backendText.textContent = "Backend connected";
    } else {
      backendDot.dataset.state = "warn";
      backendText.textContent = "Backend offline";
    }
  } catch (err) {
    logLine(`save failed: ${err.message}`);
  }
});

// ── Init ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
