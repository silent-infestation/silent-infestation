/**
 * Detects reflected SQL marker string in raw response HTML where the marker is present
 * but not accompanied by a known SQL injection pattern.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with echoed marker info or null
 */
export function detectTestingStringResponses($) {
  const marker = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_testing".toLowerCase();

  const sqlInjectionPayloads = [
    "' OR '1'='1' -- ",
    `' UNION SELECT '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING', NULL -- `,
    "' OR '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING' = '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING' --",
    "' OR 1=1--",
    "' OR 'x'='x",
    '" OR ""="',
    "' OR '1'='1' /*",
  ];

  const normalizedPayloads = sqlInjectionPayloads.map((p) =>
    p.trim().toLowerCase().replace(/\s+/g, " ")
  );

  const markerLikeRegex = new RegExp(
    `['"]?\\s*or\\s+['"]?${marker}['"]?\\s*=\\s*['"]?${marker}['"]?`,
    "i"
  );

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).text().trim();
    const normalizedText = rawText.toLowerCase().replace(/\s+/g, " ");

    const containsMarker = normalizedText.includes(marker);
    const containsInjectionPayload = normalizedPayloads.some((payload) =>
      normalizedText.includes(payload)
    );
    const matchesMarkerStructure = markerLikeRegex.test(normalizedText);

    if (containsMarker && !containsInjectionPayload && !matchesMarkerStructure) {
      foundElements.push({
        element: $(el).get(0).tagName,
        text: rawText,
        marker,
      });
    }
  });

  if (foundElements.length > 0) {
    return {
      type: "testing_string_response",
      data: foundElements,
    };
  }

  return null;
}

/**
 * Detects SQL injection response patterns based on marker presence and table-like formatting.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with matching output lines or null
 */
export function detectSQLInjectionResponses($) {
  const marker = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_testing".toLowerCase();
  const results = [];

  const indicators = [
    /^\s*id\s*[:=]/i,
    /^\s*name\s*[:=]/i,
    /^\s*\d+\s*\|\s*[a-zA-Z0-9]/,
    /^\s*\|\s*[a-zA-Z0-9]+.*?\|/,
  ];

  $("pre, code, td, span, div, p").each((_, el) => {
    const text = $(el).text().trim();
    const lower = text.toLowerCase();

    if (!lower.includes(marker)) return;

    for (const regex of indicators) {
      if (regex.test(text)) {
        results.push(text);
        break;
      }
    }
  });

  if (results.length > 0) {
    return {
      type: "sql_injection_response",
      data: results,
    };
  }

  return null;
}
