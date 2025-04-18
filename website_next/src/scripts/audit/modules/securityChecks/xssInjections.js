import * as cheerio from 'cheerio';

/**
 * Detects reflected XSS payloads in raw response HTML where the payload is echoed back.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with echoed payload info or null
 */
export function detectReflectedXSSResponses($) {
  const xssInjectionPayloads = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(1)">',
    '<svg onload="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<a href="javascript:alert(1)">Click me</a>',
  ];

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).html()?.trim();

    if (!rawText) return;

    const containsPayload = xssInjectionPayloads.some((payload) =>
      rawText.includes(payload)
    );

    if (containsPayload) {
      foundElements.push({
        element: $(el).get(0).tagName,
        text: rawText,
      });
    }
  });

  if (foundElements.length > 0) {
    return {
      type: 'xss_reflected_response',
      data: foundElements,
    };
  }

  return null;
}

/**
 * Detects stored XSS payloads in raw response HTML where the payload is stored and reflected back.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with echoed payload info or null
 */
export function detectStoredXSSResponses($) {
  const storedPayload = '<script>alert("XSS")</script>';

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).html()?.trim();

    if (!rawText) return;

    if (rawText.includes(storedPayload)) {
      foundElements.push({
        element: $(el).get(0).tagName,
        text: rawText,
      });
    }
  });

  if (foundElements.length > 0) {
    return {
      type: 'xss_stored_response',
      data: foundElements,
    };
  }

  return null;
}