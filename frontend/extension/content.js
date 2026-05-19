// Runs inside every linkedin.com page (see manifest content_scripts).
// `selectors.js` is loaded BEFORE this file, so window.LI_SELECTORS exists.
//
// Responsibilities:
//   - announce injection (console log)
//   - scan the feed for posts and extract { author, text, postId }
//   - on demand, open the comment editor of the FIRST visible post and
//     fill it with a test comment (user must click Submit themselves)

const TEST_COMMENT = "Amazing insights. Really enjoyed this perspective.";
const LOG_PREFIX = "[LinkedIn Comment Assistant]";

console.log(`${LOG_PREFIX} content script injected on ${location.href}`);

function extractPostId(postEl) {
  for (const attr of LI_SELECTORS.postIdAttrs) {
    const val = postEl.getAttribute(attr);
    if (val) return val;
  }
  return null;
}

function readFeedPosts() {
  const postEls = liQueryAll(LI_SELECTORS.post);
  const posts = postEls.map((el, idx) => {
    const authorEl = liQuery(LI_SELECTORS.postAuthor, el);
    const textEl = liQuery(LI_SELECTORS.postText, el);
    return {
      index: idx,
      postId: extractPostId(el),
      author: authorEl ? authorEl.innerText.trim() : null,
      text: textEl ? textEl.innerText.trim().slice(0, 500) : null,
    };
  });
  console.log(`${LOG_PREFIX} detected ${posts.length} feed posts`, posts);
  return posts;
}

// Quill editors don't react to plain `.textContent = "..."` — the editor
// keeps its internal model and overwrites you on the next render. The
// reliable path is: focus → execCommand('insertText'). It's deprecated
// but still the most consistent way to drive contenteditable widgets.
function fillEditor(editorEl, text) {
  editorEl.focus();

  // Clear placeholder state if Quill is showing one.
  const placeholder = editorEl.querySelector(LI_SELECTORS.emptyEditorPlaceholder);
  if (placeholder) {
    editorEl.innerHTML = "<p><br></p>";
  }

  // Select existing content so the insert replaces (not appends to) it.
  const range = document.createRange();
  range.selectNodeContents(editorEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const inserted = document.execCommand("insertText", false, text);

  if (!inserted) {
    // Fallback: write to the DOM and dispatch a synthetic input event so
    // Quill / React listeners pick it up.
    editorEl.innerHTML = `<p>${text}</p>`;
    editorEl.dispatchEvent(
      new InputEvent("input", { bubbles: true, cancelable: true, data: text })
    );
  }
}

async function openCommentEditorForFirstPost() {
  const firstPost = liQuery(LI_SELECTORS.post);
  if (!firstPost) {
    return { ok: false, reason: "no_posts_found" };
  }

  // Most posts render the comment editor lazily — clicking "Comment" mounts it.
  let editor = liQuery(LI_SELECTORS.commentEditor, firstPost);
  if (!editor) {
    const trigger = liQuery(LI_SELECTORS.commentTriggerButton, firstPost);
    if (!trigger) {
      return { ok: false, reason: "no_comment_button" };
    }
    trigger.click();
    editor = await waitForElement(LI_SELECTORS.commentEditor, firstPost, 4000);
    if (!editor) {
      return { ok: false, reason: "editor_did_not_mount" };
    }
  }

  firstPost.scrollIntoView({ behavior: "smooth", block: "center" });
  fillEditor(editor, TEST_COMMENT);
  return { ok: true, reason: "filled" };
}

function waitForElement(selectorList, root, timeoutMs) {
  return new Promise((resolve) => {
    const immediate = liQuery(selectorList, root);
    if (immediate) return resolve(immediate);

    const observer = new MutationObserver(() => {
      const el = liQuery(selectorList, root);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(root || document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SCAN_FEED") {
    sendResponse({ ok: true, posts: readFeedPosts() });
    return false;
  }

  if (message?.type === "FILL_TEST_COMMENT") {
    openCommentEditorForFirstPost()
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, reason: String(err) }));
    return true; // async response
  }

  return false;
});

// Auto-scan once on initial load so the console shows posts without any click.
window.addEventListener("load", () => {
  setTimeout(readFeedPosts, 1500);
});
