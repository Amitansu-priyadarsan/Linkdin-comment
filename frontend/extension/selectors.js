// LinkedIn DOM selectors — every selector here ships with fallbacks.
// If detection breaks, this is the FIRST file to update.
//
// NOTE (v2): Post reading now primarily uses network interception
// (linkedinNetworkSpy.js intercepts Voyager API JSON responses).
// These DOM selectors are FALLBACK only for post text/author extraction.
// The comment editor and trigger button selectors below are still
// actively used for filling AI-generated comments.
//
// Last updated: May 2026

const LI_SELECTORS = {
  // Login cookies. The "li_at" auth cookie is the strongest signal that a
  // LinkedIn session exists for www.linkedin.com.
  cookies: {
    domain: ".linkedin.com",
    authCookieNames: ["li_at", "JSESSIONID"],
  },

  // Feed post container. Each card in the home feed.
  // 2025/2026: LinkedIn switched to <article> with class "main-feed-activity-card".
  post: [
    'article.main-feed-activity-card',
    'article[data-id="main-feed-card"]',
    'article[data-activity-urn]',
    // Legacy fallbacks:
    'div.feed-shared-update-v2',
    'div[data-id^="urn:li:activity:"]',
  ],

  // Author / actor name inside a post card.
  // 2025/2026: <a> with tracking control name for the actor name.
  postAuthor: [
    'a[data-tracking-control-name="feed_main-feed-card_feed-actor-name"]',
    'a[data-feed-control="actor"]',
    // Legacy fallbacks:
    '.update-components-actor__title span[aria-hidden="true"]',
    '.update-components-actor__name span[aria-hidden="true"]',
  ],

  // The post's body text.
  // 2025/2026: <p> with data-test-id for the commentary.
  postText: [
    'p[data-test-id="main-feed-activity-card__commentary"]',
    '.attributed-text-segment-list__content',
    // Legacy fallbacks:
    '.update-components-text .break-words',
    '.update-components-text',
    '.feed-shared-text',
  ],

  // Attribute on the post container that holds the activity URN.
  // 2025/2026: data-activity-urn and data-attributed-urn on the <article>.
  postIdAttrs: ['data-activity-urn', 'data-attributed-urn', 'data-urn', 'data-id'],

  // Button that opens the comment editor for a post.
  // 2025/2026: Social action bar buttons with specific data attributes or text.
  commentTriggerButton: [
    'button[data-feed-action-type="expandComments"]',
    '.social-action-bar button[aria-label*="omment"]',
    '.social-action-bar button[aria-label^="Comment"]',
    'button.comment-button',
    'button[aria-label^="Comment"]',
    'button[aria-label*="omment"]',
  ],

  // The actual rich-text comment editor.
  // 2025/2026: LinkedIn may still use Quill or a contenteditable div.
  commentEditor: [
    'div[contenteditable="true"][role="textbox"]',
    '.comments-comment-box__form-container .ql-editor',
    '.comments-comment-texteditor .ql-editor',
    'div[contenteditable="true"][role="textbox"].ql-editor',
  ],

  // Placeholder paragraph Quill renders inside an empty editor.
  emptyEditorPlaceholder: 'p.ql-blank, p[data-placeholder]',
};

// Get shadow root using Chrome's extension API that works with CLOSED shadow roots.
// Falls back to el.shadowRoot for open ones.
function getShadowRoot(el) {
  try {
    // chrome.dom.openOrClosedShadowRoot works for BOTH open and closed shadow roots
    if (typeof chrome !== 'undefined' && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
      return chrome.dom.openOrClosedShadowRoot(el);
    }
  } catch (e) { /* ignore */ }
  // Fallback for open shadow roots
  return el.shadowRoot || null;
}

// Recursively query inside shadow roots (including closed ones).
function deepQuery(selector, root) {
  const scope = root || document;
  const result = scope.querySelector(selector);
  if (result) return result;

  // Search inside shadow roots of all children
  const children = scope.querySelectorAll('*');
  for (const child of children) {
    const sr = getShadowRoot(child);
    if (sr) {
      const found = deepQuery(selector, sr);
      if (found) return found;
    }
  }
  return null;
}

function deepQueryAll(selector, root) {
  const scope = root || document;
  let results = Array.from(scope.querySelectorAll(selector));

  // Also search inside shadow roots (including closed ones)
  const children = scope.querySelectorAll('*');
  for (const child of children) {
    const sr = getShadowRoot(child);
    if (sr) {
      results = results.concat(deepQueryAll(selector, sr));
    }
  }
  return results;
}

// Pick the first selector that matches in `root` (defaults to document).
// Traverses shadow roots (including closed) to find elements LinkedIn hides.
function liQuery(selectorList, root) {
  for (const sel of selectorList) {
    const el = root ? (root.querySelector(sel) || null) : deepQuery(sel);
    if (el) return el;
  }
  return null;
}

// Pick all matches for the FIRST selector that returns anything.
function liQueryAll(selectorList, root) {
  for (const sel of selectorList) {
    const els = root ? Array.from(root.querySelectorAll(sel)) : deepQueryAll(sel);
    if (els.length > 0) return els;
  }
  return [];
}

// Expose globally so content.js (loaded after this file) can use them.
window.LI_SELECTORS = LI_SELECTORS;
window.liQuery = liQuery;
window.liQueryAll = liQueryAll;
window.deepQuery = deepQuery;
window.deepQueryAll = deepQueryAll;
window.getShadowRoot = getShadowRoot;

