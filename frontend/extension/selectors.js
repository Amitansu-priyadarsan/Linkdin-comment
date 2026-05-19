// LinkedIn DOM is volatile — every selector here ships with fallbacks.
// If detection breaks, this is the FIRST file to update.
// Open a feed post in DevTools and add a new selector to the front of the array.

const LI_SELECTORS = {
  // Login cookies. The "li_at" auth cookie is the strongest signal that a
  // LinkedIn session exists for www.linkedin.com.
  cookies: {
    domain: ".linkedin.com",
    authCookieNames: ["li_at", "JSESSIONID"],
  },

  // Feed post container. Each card in the home feed.
  post: [
    'div.feed-shared-update-v2',
    'div[data-id^="urn:li:activity:"]',
    'div.scaffold-finite-scroll__content [data-urn^="urn:li:activity:"]',
  ],

  // Author / actor name inside a post card.
  postAuthor: [
    '.update-components-actor__title span[aria-hidden="true"]',
    '.update-components-actor__name span[aria-hidden="true"]',
    '.update-components-actor__name',
    'a.app-aware-link .visually-hidden + span',
  ],

  // The post's body text.
  postText: [
    '.update-components-text .break-words',
    '.feed-shared-update-v2__description .break-words',
    '.update-components-text',
    '.feed-shared-text',
  ],

  // Attribute on the post container that holds the activity URN.
  postIdAttrs: ['data-urn', 'data-id'],

  // Button that opens the comment editor for a post.
  commentTriggerButton: [
    'button.comment-button',
    'button[aria-label^="Comment"]',
    'button[aria-label*="omment"]',
  ],

  // The actual rich-text comment editor. LinkedIn uses Quill (`.ql-editor`).
  commentEditor: [
    '.comments-comment-box__form-container .ql-editor',
    '.comments-comment-texteditor .ql-editor',
    'div[contenteditable="true"][role="textbox"].ql-editor',
    'div[contenteditable="true"][role="textbox"]',
  ],

  // Placeholder paragraph Quill renders inside an empty editor.
  emptyEditorPlaceholder: 'p.ql-blank, p[data-placeholder]',
};

// Pick the first selector that matches in `root` (defaults to document).
function liQuery(selectorList, root) {
  const scope = root || document;
  for (const sel of selectorList) {
    const el = scope.querySelector(sel);
    if (el) return el;
  }
  return null;
}

// Pick all matches for the FIRST selector that returns anything.
function liQueryAll(selectorList, root) {
  const scope = root || document;
  for (const sel of selectorList) {
    const els = scope.querySelectorAll(sel);
    if (els.length > 0) return Array.from(els);
  }
  return [];
}

// Expose globally so content.js (loaded after this file) can use them.
window.LI_SELECTORS = LI_SELECTORS;
window.liQuery = liQuery;
window.liQueryAll = liQueryAll;
