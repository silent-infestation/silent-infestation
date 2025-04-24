/**
 * Detects reflected XSS payloads (JS and non-JS) in the HTML document.
 * Returns structured data including element and matched payload.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with element and payload info
 */
export function detectReflectedXSSResponses($) {
  const xssInjectionPayloads = [
    "<svg><title>XSS-TEST</title></svg>",
    '<img src="x" alt="XSS-Payload">',
    "<svg><desc>XSS-Test</desc></svg>",
  ];

  const normalizedPayloads = xssInjectionPayloads.map((p) =>
    p.trim().toLowerCase().replace(/\s+/g, " ")
  );

  const foundMatches = [];

  $("*").each((_, el) => {
    const tag = el.tagName;
    const rawHtml = $.html(el).trim().toLowerCase().replace(/\s+/g, " ");

    for (const payload of normalizedPayloads) {
      if (rawHtml.includes(payload)) {
        foundMatches.push({
          element: tag,
          matchedPayload: payload,
          html: $.html(el).trim(),
        });
        break; // Only capture once per element
      }
    }
  });

  if (foundMatches.length > 0) {
    return {
      type: "reflected_xss_response",
      data: foundMatches,
    };
  }

  return null;
}

/**
 * Detects stored XSS response patterns based on marker presence and suspicious HTML attributes.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with matching output lines or null
 */
export function detectStoredXSSResponses($) {
  const marker = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_testing".toLowerCase();
  const results = [];

  const suspiciousAttributes = [/onerror\s*=/i, /onload\s*=/i, /onclick\s*=/i, /javascript:/i];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawHtml = $(el).html()?.trim();
    const lowerHtml = rawHtml?.toLowerCase();

    if (!lowerHtml?.includes(marker)) return;

    for (const regex of suspiciousAttributes) {
      if (regex.test(lowerHtml)) {
        results.push(rawHtml);
        break;
      }
    }
  });

  if (results.length > 0) {
    return {
      type: "stored_xss_response",
      data: results,
    };
  }

  return null;
}
