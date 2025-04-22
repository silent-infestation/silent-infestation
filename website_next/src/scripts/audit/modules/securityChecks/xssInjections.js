import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

export function getPayloadsFromFile() {
  const filePath = path.join(process.cwd(), 'website_next/src/scripts/audit/utils', 'xss-payloads-list.txt');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const payloads = fileContent.split('\n').filter((line) => line.trim() !== '');
  return payloads;
}

/**
 * Detects reflected XSS payloads in raw response HTML where the payload is echoed back.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} detection result with echoed payload info or null
 */

export function detectReflectedXSSResponses($) {
  console.info('Detecting reflected XSS payloads in response...');
  const xssInjectionPayloads = getPayloadsFromFile();

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).html()?.trim();

    if (!rawText) return;

    const containsPayload = xssInjectionPayloads.some((payload) =>
      rawText.includes(payload)
    );

    if (containsPayload) {
      console.info(`Found reflected XSS payload in element: ${$(el).get(0).tagName}`);
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
  console.info('Detecting stored XSS payloads in response...');
  const storedPayload = '<script>alert("XSS")</script>';

  const foundElements = [];

  $("body, pre, div, span, code, p, td, li").each((_, el) => {
    const rawText = $(el).html()?.trim();

    if (!rawText) return;

    if (rawText.includes(storedPayload)) {
      console.info(`Found stored XSS payload in element: ${$(el).get(0).tagName}`);
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