/**
 * Detects reflected XSS marker string in raw response HTML where the marker is present
 * but not accompanied by a known XSS injection pattern.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with echoed marker info or null
 */
export function detectReflectedXSSResponses($) {
  const marker = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_testing".toLowerCase();

  const xssInjectionPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">Click me</a>',
  ];

  const normalizedPayloads = xssInjectionPayloads.map((p) =>
    p.trim().toLowerCase().replace(/\s+/g, " ")
  );

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).html()?.trim();
    const normalizedText = rawText?.toLowerCase().replace(/\s+/g, " ");

    const containsMarker = normalizedText?.includes(marker);
    const containsInjectionPayload = normalizedPayloads.some((payload) =>
      normalizedText?.includes(payload)
    );

    if (containsMarker && !containsInjectionPayload) {
      foundElements.push({
        element: $(el).get(0).tagName,
        text: rawText,
        marker,
      });
    }
  });

  if (foundElements.length > 0) {
    return {
      type: "reflected_xss_response",
      data: foundElements,
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

  const suspiciousAttributes = [
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /javascript:/i,
  ];

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