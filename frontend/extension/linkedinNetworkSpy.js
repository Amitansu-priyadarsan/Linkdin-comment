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
      const initObj = typeof args[0] === 'string' ? args[1] : undefined;
      const headers = initObj?.headers || (args[0]?.headers);

      if (headers) {
        let csrf = null;
        if (headers instanceof Headers) {
          csrf = headers.get('csrf-token');
        } else if (typeof headers === 'object') {
          csrf = headers['csrf-token'] || headers['Csrf-Token'];
        }

        if (csrf) {
          window.postMessage(
            { type: 'LINKEDIN_AUTH_CAPTURED', csrfToken: csrf },
            '*'
          );
        }
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
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (name.toLowerCase() === 'csrf-token' && value) {
      window.postMessage(
        { type: 'LINKEDIN_AUTH_CAPTURED', csrfToken: value },
        '*'
      );
    }
    return origSetHeader.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    const self = this;
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
