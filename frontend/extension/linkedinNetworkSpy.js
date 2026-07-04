/**
 * LinkedIn Network Spy + Auto-Scroller (MAIN World)
 * ──────────────────────────────────────────────────
 * Executes in the MAIN world context of www.linkedin.com.
 *
 * 1. Patches fetch() and XMLHttpRequest to intercept LinkedIn's API responses
 *    — gives us structured post data instead of fragile DOM selectors.
 * 2. Captures the csrf-token header from outgoing requests.
 * 3. Provides an auto-scroll function to trigger feed lazy-loading.
 *
 * LinkedIn migrated to React Server Components (RSC) in 2025-2026.
 * Feed data now arrives via /flagship-web/rsc-action/ endpoints instead
 * of the old Voyager /feed/updatesV2 REST API.
 */

(function () {
  if (window.__li_spy_initialized) return;
  window.__li_spy_initialized = true;

  const SPY_LOG = "[LI-Spy]";

  // ── URL patterns to intercept ──────────────────────────────────────────────

  const FEED_PATTERNS = [
    // New RSC-based feed endpoints (2025-2026)
    '/flagship-web/rsc-action/actions/pagination',
    '/flagship-web/rsc-action',
    // Legacy Voyager endpoints (may still fire on some pages)
    '/feed/updatesV2',
    '/feed/updates',
    '/voyager/api/feed',
  ];

  // Additional patterns for specific post pages
  const POST_PATTERNS = [
    '/voyager/api/feed/updates',
    '/voyager/api/graphql',
  ];

  function isFeedUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return FEED_PATTERNS.some((p) => url.includes(p));
  }

  function isPostRelatedUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return POST_PATTERNS.some((p) => url.includes(p));
  }

  // A comment-creation request is a POST to the socialActions/comments
  // endpoint (or the legacy feed/comments). We watch for these so we can
  // LEARN the exact URL + headers LinkedIn uses, then replay them.
  function isCommentCreateUrl(url, method) {
    if (!url || typeof url !== 'string') return false;
    if ((method || '').toUpperCase() !== 'POST') return false;
    const u = url.toLowerCase();
    return (
      (u.includes('/socialactions/') && u.includes('/comments')) ||
      u.includes('/voyager/api/feed/comments')
    );
  }

  // ── Parse different response formats ──────────────────────────────────────

  /**
   * Try to extract post data from an RSC (React Server Components) response.
   * RSC responses are streamed as lines of encoded data. Post content is
   * embedded within the serialized component tree.
   */
  function parseRscResponse(text) {
    const posts = [];

    try {
      // RSC responses often contain JSON fragments on separate lines
      // Each line may be prefixed with a number and colon (chunk ID)
      const lines = text.split('\n');

      for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;

        // Try to find JSON objects/arrays in each line
        const jsonMatches = extractJsonFromLine(line);
        for (const jsonData of jsonMatches) {
          const extracted = extractPostsFromAny(jsonData);
          for (const post of extracted) {
            if (post.urn && !posts.find(p => p.urn === post.urn)) {
              posts.push(post);
            }
          }
        }
      }

      // Also try to find URN patterns and text content directly
      const urnMatches = text.matchAll(/urn:li:activity:(\d+)/g);
      const foundUrns = new Set(posts.map(p => p.urn));

      for (const match of urnMatches) {
        const urn = `urn:li:activity:${match[1]}`;
        if (!foundUrns.has(urn)) {
          posts.push({
            urn,
            text: null,
            author: null,
            timestamp: null,
            socialCounts: null,
            source: 'network_intercept',
          });
          foundUrns.add(urn);
        }
      }
    } catch (e) {
      // Silent fail — non-critical
    }

    return posts;
  }

  /**
   * Extract JSON objects/arrays from a line that may have RSC framing.
   * Lines can look like: `0:["$","div",null,{"children":...}]`
   * or contain embedded JSON strings.
   */
  function extractJsonFromLine(line) {
    const results = [];

    // Strip RSC chunk prefix (e.g., "0:", "1:", "a3:")
    let stripped = line.replace(/^[0-9a-f]+:/, '').trim();

    // Try direct JSON parse
    try {
      const parsed = JSON.parse(stripped);
      results.push(parsed);
    } catch (_) {
      // Not valid JSON — try to find embedded JSON strings
    }

    // Look for JSON objects embedded in the text
    const objPattern = /\{[^{}]*"urn:li:activity:[^{}]*\}/g;
    let m;
    while ((m = objPattern.exec(line)) !== null) {
      try {
        results.push(JSON.parse(m[0]));
      } catch (_) { /* skip */ }
    }

    return results;
  }

  /**
   * Recursively search any JSON structure for post-like data.
   * Works with both Voyager JSON and RSC-embedded data.
   */
  function extractPostsFromAny(data, depth = 0) {
    const posts = [];
    if (!data || depth > 10) return posts;

    if (Array.isArray(data)) {
      for (const item of data) {
        posts.push(...extractPostsFromAny(item, depth + 1));
      }
      return posts;
    }

    if (typeof data !== 'object') return posts;

    // Check if this object IS a post
    const post = tryExtractPost(data);
    if (post) {
      posts.push(post);
    }

    // Check "elements" and "included" arrays (Voyager format)
    if (data.elements) {
      posts.push(...extractPostsFromAny(data.elements, depth + 1));
    }
    if (data.included) {
      posts.push(...extractPostsFromAny(data.included, depth + 1));
    }
    if (data.data) {
      posts.push(...extractPostsFromAny(data.data, depth + 1));
    }
    if (data.results) {
      posts.push(...extractPostsFromAny(data.results, depth + 1));
    }

    // Check nested children (RSC component tree)
    if (data.children) {
      posts.push(...extractPostsFromAny(data.children, depth + 1));
    }
    if (data.props) {
      posts.push(...extractPostsFromAny(data.props, depth + 1));
    }

    return posts;
  }

  function tryExtractPost(item) {
    if (!item || typeof item !== 'object') return null;

    // Find an activity URN anywhere in this object
    let urn = null;
    const urnFields = [
      'entityUrn', 'urn', 'activityUrn', 'updateUrn',
      '*entityUrn', 'backendUrn', 'activityId'
    ];

    for (const field of urnFields) {
      const val = item[field];
      if (typeof val === 'string' && val.includes('activity:')) {
        urn = val;
        break;
      }
    }

    // Also check nested updateMetadata
    if (!urn && item.updateMetadata?.urn?.includes('activity:')) {
      urn = item.updateMetadata.urn;
    }

    if (!urn) return null;

    // Extract text (try many known paths)
    let text = '';
    const textSources = [
      item.commentary?.text?.text,
      item.commentary?.text,
      item.commentary,
      item.annotation?.text,
      item.resharedCommentary?.text?.text,
      item.content?.attributedText?.text,
      item.text?.text,
      item.text,
      item.title?.text,
    ];

    for (const src of textSources) {
      if (typeof src === 'string' && src.length > 10) {
        text = src;
        break;
      }
    }

    // Extract author
    let author = null;
    let headline = null;

    if (item.actor?.name?.text) {
      author = item.actor.name.text;
      headline = item.actor.description?.text || null;
    } else if (item.firstName && item.lastName) {
      author = `${item.firstName} ${item.lastName}`;
      headline = item.occupation || item.headline || null;
    } else if (item.name) {
      author = typeof item.name === 'string' ? item.name : item.name?.text || null;
    }

    // Social counts
    let socialCounts = null;
    const social = item.socialDetail || item.socialContent || null;
    if (social?.totalSocialActivityCounts) {
      socialCounts = {
        likes: social.totalSocialActivityCounts.numLikes ?? 0,
        comments: social.totalSocialActivityCounts.numComments ?? 0,
        reposts: social.totalSocialActivityCounts.numShares ?? 0,
      };
    }

    return {
      urn,
      text: text || null,
      author: author ? { name: author, headline: headline || '' } : null,
      timestamp: item.createdAt || null,
      socialCounts,
      source: 'network_intercept',
    };
  }

  // ── Legacy Voyager JSON parser ─────────────────────────────────────────────

  function parseFeedResponse(data) {
    return extractPostsFromAny(data);
  }

  // ── Process any intercepted response ───────────────────────────────────────

  async function processResponse(url, response) {
    try {
      const clone = response.clone();
      const contentType = clone.headers?.get?.('content-type') || '';
      let posts = [];

      if (contentType.includes('json')) {
        // Standard JSON response (Voyager API)
        const data = await clone.json();
        posts = parseFeedResponse(data);
      } else {
        // RSC or text response — try text parsing
        const text = await clone.text();
        if (text.includes('activity:') || text.includes('commentary') || text.includes('updateMetadata')) {
          posts = parseRscResponse(text);
        }
      }

      if (posts.length > 0) {
        console.log(`${SPY_LOG} Intercepted ${posts.length} posts from: ${url.substring(0, 80)}`);
        window.postMessage(
          { type: 'LINKEDIN_FEED_DATA', posts },
          '*'
        );
      }
    } catch (_) {
      /* Silent fail — non-critical */
    }
  }

  // ── Patch fetch() ──────────────────────────────────────────────────────────

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const url =
      typeof args[0] === 'string'
        ? args[0]
        : args[0]?.url || '';

    // Capture csrf-token from outgoing request
    try {
      const initObj = typeof args[0] === 'string' ? args[1] : (args[1] || args[0]);
      const method = initObj?.method || (typeof args[0] === 'object' ? args[0]?.method : 'GET');
      const headers = initObj?.headers || (args[0]?.headers);

      if (headers) {
        let csrf = null;
        if (headers instanceof Headers) {
          csrf = headers.get('csrf-token');
        } else if (typeof headers === 'object') {
          csrf = headers['csrf-token'] || headers['Csrf-Token'];
        }

        if (csrf) {
          setCsrf(csrf);
          window.postMessage(
            { type: 'LINKEDIN_AUTH_CAPTURED', csrfToken: csrf },
            '*'
          );
        }
      }

      // Learn the exact shape of comment requests LinkedIn makes, for replay.
      if (isCommentCreateUrl(url, method)) {
        learnCommentRecipe(url, headers);
      }
    } catch (_) {
      /* swallow — non-critical */
    }

    // Call original fetch
    const response = await originalFetch.apply(this, args);

    // Intercept feed and post-related responses
    if (isFeedUrl(url) || isPostRelatedUrl(url)) {
      processResponse(url, response);
    }

    return response;
  };

  // ── Patch XMLHttpRequest ───────────────────────────────────────────────────

  const origOpen = XMLHttpRequest.prototype.open;
  const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._url = url;
    this._method = method;
    this._headers = {};
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (this._headers) this._headers[name.toLowerCase()] = value;
    if (name.toLowerCase() === 'csrf-token' && value) {
      setCsrf(value);
      window.postMessage(
        { type: 'LINKEDIN_AUTH_CAPTURED', csrfToken: value },
        '*'
      );
    }
    return origSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    const self = this;

    // Learn comment-request shape when LinkedIn posts a comment via XHR.
    if (self._url && isCommentCreateUrl(self._url, self._method)) {
      learnCommentRecipe(self._url, self._headers);
    }

    if (self._url && (isFeedUrl(self._url) || isPostRelatedUrl(self._url))) {
      self.addEventListener('load', function () {
        try {
          const contentType = self.getResponseHeader('content-type') || '';
          if (contentType.includes('json')) {
            const data = JSON.parse(self.responseText);
            const posts = parseFeedResponse(data);
            if (posts.length > 0) {
              window.postMessage(
                { type: 'LINKEDIN_FEED_DATA', posts },
                '*'
              );
            }
          } else if (self.responseText) {
            const posts = parseRscResponse(self.responseText);
            if (posts.length > 0) {
              window.postMessage(
                { type: 'LINKEDIN_FEED_DATA', posts },
                '*'
              );
            }
          }
        } catch (_) {
          /* Silent fail */
        }
      });
    }
    return origSend.apply(this, arguments);
  };

  // ── Comment Posting (Direct API — same-origin, user's own session) ─────────
  //
  // Posts a comment by calling LinkedIn's own Voyager endpoint from the page's
  // MAIN world. Because this runs in the page context on www.linkedin.com:
  //   - the li_at / JSESSIONID cookies are attached automatically (credentials)
  //   - the request shares LinkedIn's origin, TLS fingerprint, and headers
  // so it is indistinguishable from the user commenting in the LinkedIn UI.
  //
  // Robustness strategy:
  //   1. LEARN — whenever LinkedIn itself fires a comment request, we capture
  //      its URL template + headers into `learnedRecipe`. Replaying that exact
  //      shape survives LinkedIn's periodic endpoint/header changes.
  //   2. FALLBACK — if we've never seen one, use the well-known socialActions
  //      endpoint and try a few known body shapes until one is accepted.

  let capturedCsrf = null;
  let learnedRecipe = null; // { urlTemplate, headers }

  function setCsrf(token) {
    if (token) capturedCsrf = token;
  }

  // The csrf-token header value equals the JSESSIONID cookie value with the
  // surrounding double-quotes stripped (e.g. cookie "ajax:123" → header ajax:123).
  function getCsrfToken() {
    if (capturedCsrf) return capturedCsrf;
    const m = document.cookie.match(/JSESSIONID="?([^";]+)"?/);
    return m ? m[1] : null;
  }

  const RAW_URN_RE = /urn:li:activity:\d+/;
  const ENC_URN_RE = /urn%3Ali%3Aactivity%3A\d+/i;

  // Turn a concrete comment URL into a template with the activity URN swapped
  // for a {URN} placeholder, so we can substitute the target post later.
  function toUrlTemplate(url) {
    if (ENC_URN_RE.test(url)) return url.replace(ENC_URN_RE, '{URN}');
    if (RAW_URN_RE.test(url)) return url.replace(RAW_URN_RE, '{URN}');
    return url;
  }

  // Capture the shape of a comment request LinkedIn made, for later replay.
  function learnCommentRecipe(url, headers) {
    try {
      const urlTemplate = toUrlTemplate(url);
      // Only keep the headers that matter for a Voyager write.
      const keep = [
        'accept',
        'content-type',
        'csrf-token',
        'x-restli-protocol-version',
        'x-li-lang',
        'x-li-track',
        'x-li-page-instance',
      ];
      const flat = {};
      const read = (name) => {
        if (!headers) return null;
        if (headers instanceof Headers) return headers.get(name);
        if (typeof headers === 'object') {
          return headers[name] ?? headers[name.toLowerCase()] ?? null;
        }
        return null;
      };
      for (const name of keep) {
        const v = read(name);
        if (v) flat[name] = v;
      }
      if (flat['csrf-token']) setCsrf(flat['csrf-token']);
      learnedRecipe = { urlTemplate, headers: flat };
      console.log(`${SPY_LOG} Learned comment recipe from ${urlTemplate}`);
      window.postMessage(
        { type: 'LINKEDIN_COMMENT_RECIPE_LEARNED', urlTemplate },
        '*'
      );
    } catch (_) {
      /* non-critical */
    }
  }

  // Body shapes to try, in order. LinkedIn has used all of these across
  // versions; the learned recipe usually makes shape #1 land first try.
  function commentBodyShapes(text) {
    return [
      { commentary: { text: text, attributes: [] } },
      { comment: { text: { text: text, attributes: [] } } },
      { message: { text: text, attributes: [] } },
    ];
  }

  function defaultHeaders(token) {
    return {
      accept: 'application/vnd.linkedin.normalized+json+2.1',
      'content-type': 'application/json; charset=UTF-8',
      'csrf-token': token,
      'x-restli-protocol-version': '2.0.0',
      'x-li-lang': 'en_US',
    };
  }

  async function submitComment(urn, text) {
    if (!urn) return { ok: false, error: 'missing_urn' };
    if (!text || !text.trim()) return { ok: false, error: 'empty_text' };

    const token = getCsrfToken();
    if (!token) {
      return {
        ok: false,
        error: 'no_csrf_token',
        hint: 'Scroll the feed once so a csrf-token is captured, then retry.',
      };
    }

    const encUrn = encodeURIComponent(urn);

    // Build the ordered list of (url, headers) targets to try.
    const targets = [];
    if (learnedRecipe) {
      const headers = { ...learnedRecipe.headers, 'csrf-token': token };
      targets.push({
        url: learnedRecipe.urlTemplate.replace('{URN}', encUrn),
        headers,
        label: 'learned',
      });
    }
    // Well-known fallback endpoint.
    targets.push({
      url: `https://www.linkedin.com/voyager/api/socialActions/${encUrn}/comments`,
      headers: defaultHeaders(token),
      label: 'default-socialActions',
    });

    const shapes = commentBodyShapes(text.trim());
    const attempts = [];

    for (const target of targets) {
      for (let i = 0; i < shapes.length; i++) {
        try {
          const res = await originalFetch(target.url, {
            method: 'POST',
            credentials: 'include',
            headers: target.headers,
            body: JSON.stringify(shapes[i]),
          });

          const status = res.status;
          if (status >= 200 && status < 300) {
            return {
              ok: true,
              status,
              via: target.label,
              bodyShape: i,
              urn,
            };
          }

          const errText = await res.text().catch(() => '');
          attempts.push({ via: target.label, bodyShape: i, status, errText: errText.slice(0, 200) });

          // Auth failures won't be fixed by a different body shape — bail early.
          if (status === 401 || status === 403) break;
        } catch (err) {
          attempts.push({ via: target.label, bodyShape: i, error: String(err) });
        }
      }
    }

    return { ok: false, error: 'all_attempts_failed', urn, attempts };
  }

  // ── Comment message bridge (ISOLATED world → MAIN → back) ──────────────────

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;
    if (event.data.type !== 'LINKEDIN_SUBMIT_COMMENT') return;

    const { requestId, urn, text } = event.data;
    submitComment(urn, text).then((result) => {
      window.postMessage(
        { type: 'LINKEDIN_SUBMIT_COMMENT_RESULT', requestId, result },
        '*'
      );
    });
  });

  // ── Auto-Scroller ──────────────────────────────────────────────────────────

  let _scrolling = false;

  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === 'START_AUTO_SCROLL' && !_scrolling) {
      const batches = event.data.batches || 10;
      autoScrollFeed(batches);
    }

    if (event.data.type === 'STOP_AUTO_SCROLL') {
      _scrolling = false;
    }
  });

  function autoScrollFeed(batches) {
    _scrolling = true;
    let count = 0;

    const tick = () => {
      if (!_scrolling || count >= batches) {
        _scrolling = false;
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          window.postMessage({ type: 'AUTO_SCROLL_COMPLETE' }, '*');
        }, 800);
        return;
      }

      const distance = window.innerHeight * (0.7 + Math.random() * 0.6);
      window.scrollBy({ top: distance, behavior: 'smooth' });
      count++;

      window.postMessage(
        { type: 'AUTO_SCROLL_PROGRESS', current: count, total: batches },
        '*'
      );

      const delay = 1500 + Math.random() * 1000;
      setTimeout(tick, delay);
    };

    tick();
  }

  console.log(`${SPY_LOG} initialized — watching for feed data`);
})();
