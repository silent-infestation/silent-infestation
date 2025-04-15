import axios from "axios";
import * as cheerio from "cheerio";
import Crawler from "crawler";
import { URL } from "url";
import * as jwt from "jsonwebtoken";

/**
 * We re-use the same global scanResultsMap that your route uses.
 * So partial updates can be read by /api/scan-status mid-scan.
 */
const scanResultsMap = global.scanResultsMap || new Map();
global.scanResultsMap = scanResultsMap;

// ------------------------
// Constants
// ------------------------
const USER_LIST = ["root", "admin"];
const PASSWORD_LIST = ["123456", "password", "12345678"];
const INJECTION_MARKER = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING";
const SQLI_PAYLOADS = [
  `' UNION SELECT '${INJECTION_MARKER}', NULL -- `,
  `' OR '${INJECTION_MARKER}' = '${INJECTION_MARKER}' -- `,
];
const PARAM_TAMPERING_PAYLOADS = ["9999", "1 OR 1=1", "<script>alert('x')</script>"];

// ------------------------
// Exported main function
// ------------------------
/**
 * Run the entire security audit, returning partial results incrementally.
 *
 * @param {string} startUrl The starting URL for the crawler
 * @param {string} userId   The unique ID (from JWT) for the user, so we know
 *                          where to store partial updates in `scanResultsMap`.
 * @returns {Promise<object>} The final results once the entire scan finishes
 */
export async function runAudit(startUrl, userId) {
  // ------------------------
  // PARTIAL RESULTS (updated progressively)
  // ------------------------
  /**
   * We'll store partial results in this object.
   * - crawledUrls: array of URLs discovered by the crawler
   * - securityFindings: array of vulnerability objects (e.g. {type, url, detail, ...})
   */
  const partialData = {
    crawledUrls: [],
    securityFindings: [],
  };

  // We'll track visited URLs in memory to avoid double-crawling
  const visitedUrls = new Map(); // URL -> cheerio object

  // For deduplicating security findings
  const recordedFindings = new Set();

  // For some global counters used in brute force detection
  let attemptsCount = 0;
  let rateLimitDetected = false;
  let accountLockoutDetected = false;
  let progressiveDelayDetected = false;
  const requestTimes = [];

  // Immediately store an **empty** partial object so that
  // /api/scan-status can see that we've started.
  scanResultsMap.set(userId, partialData);

  // A small helper to "save" partialData back to the global map
  function updatePartialData() {
    // Overwrite the user’s partial data with the latest
    scanResultsMap.set(userId, { ...partialData });
  }

  // ------------------------
  // Deduplicated noteFinding with partial update
  // ------------------------
  function noteFinding(type, url, detail, options = {}) {
    let domain;
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url;
    }

    const signature = `${type}::${domain}::${detail}`;
    if (recordedFindings.has(signature)) {
      // skip duplicates
      return;
    }
    recordedFindings.add(signature);

    const { confidence = "medium", severity = "medium" } = options;
    partialData.securityFindings.push({ type, url, detail, confidence, severity });

    // Persist partial update
    updatePartialData();
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
  async function checkHTTPS(pageUrl) {
    if (pageUrl.toLowerCase().startsWith("https://")) {
      return;
    }
    try {
      const resp = await axios.head(pageUrl, { maxRedirects: 0 });
      if (!resp.headers.location || !resp.headers.location.toLowerCase().startsWith("https://")) {
        noteFinding(
          "insecure_transport",
          pageUrl,
          "Site does not use HTTPS and does not redirect to HTTPS",
          { confidence: "high", severity: "high" }
        );
      }
    } catch (err) {
      noteFinding("insecure_transport", pageUrl, "Site does not use HTTPS (HEAD check failed)", {
        confidence: "medium",
        severity: "medium",
      });
    }
  }

  function checkCredentialsInUrl(pageUrl) {
    try {
      const parsed = new URL(pageUrl);
      for (const [key, val] of parsed.searchParams.entries()) {
        const kLower = key.toLowerCase();
        const vLower = val.toLowerCase();

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
    } catch {}
  }

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

  function checkCookiesForSecurityFlags(setCookieHeader, pageUrl) {
    if (!setCookieHeader) return;
    const domain = new URL(pageUrl).hostname;
    const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    cookieArray.forEach((cookieStr) => {
      const lower = cookieStr.toLowerCase();
      const matchName = cookieStr.match(/^([^=]+)=/);
      if (!matchName) return;
      const cookieName = matchName[1].trim();

      if (/(session|auth|jwt|sid)/i.test(cookieName)) {
        const missingFlags = [];
        if (!lower.includes("secure") && domain !== "localhost") {
          missingFlags.push("Secure");
        }
        if (!lower.includes("httponly")) {
          missingFlags.push("HttpOnly");
        }

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
        const location = tamperedResp.headers.location || "";
        if (
          location.toLowerCase().includes("/dashboard") ||
          location.toLowerCase().includes("/admin")
        ) {
          noteFinding(
            "improper_jwt_handling",
            pageUrl,
            "Server redirected to protected resource with a tampered/unsigned JWT",
            { confidence: "high", severity: "critical" }
          );
        }
      }
    } catch (err) {
      console.warn("[JWT Exploit Error]", err.message);
    }
  }

  // ------------------------
  // SQL / Pattern Detection
  // ------------------------
  function detectTestingStringResponses($) {
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

    const unionSelectRegex = /union\s+select/i;
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
        console.debug(
          `[detectTestingStringResponses] Marker "${marker}" found in <${$(el).get(0).tagName}> without known payload or OR-marker pattern: "${rawText}"`
        );
        foundElements.push({
          element: $(el).get(0).tagName,
          text: rawText,
          marker,
        });
      } else if (containsMarker) {
        console.debug(
          `[detectTestingStringResponses] Marker skipped in <${$(el).get(0).tagName}> due to full payload or reflected OR-marker pattern: "${rawText}"`
        );
      }
    });

    if (foundElements.length > 0) {
      console.debug(
        `[detectTestingStringResponses] ${foundElements.length} valid marker echoes found.`
      );
      return {
        type: "testing_string_response",
        data: foundElements,
      };
    }

    console.debug("[detectTestingStringResponses] No marker-based results found.");
    return null;
  }

  function detectSQLInjectionResponses($) {
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

      if (!lower.includes(marker)) return; // skip if marker not present

      for (const regex of indicators) {
        if (regex.test(text)) {
          console.debug(
            `[detectSQLInjectionResponses] Marker + SQL output pattern detected in <${$(el).get(0).tagName}>: "${text}"`
          );
          results.push(text);
          break;
        }
      }
    });

    if (results.length > 0) {
      console.debug(
        `[detectSQLInjectionResponses] ${results.length} valid SQLi responses with marker found.`
      );
      return {
        type: "sql_injection_response",
        data: results,
      };
    }

    console.debug("[detectSQLInjectionResponses] No marker-based SQLi results found.");
    return null;
  }

  function detectPatterns($) {
    const detections = [detectSQLInjectionResponses, detectTestingStringResponses]
      .map((fn) => fn($))
      .filter(Boolean);

    if (detections.length > 1) {
      return { combined: true, detections, confidence: "high", severity: "high" };
    } else if (detections.length === 1) {
      return {
        combined: false,
        detections,
        confidence: "medium",
        severity: "medium",
      };
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

    if (status === 403) return true;

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

    checkCookiesForSecurityFlags(headers["set-cookie"], resp.config?.url || "N/A");

    const setCookieHeader = headers["set-cookie"];
    const hasSessionCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader.some((c) => /session|auth|jwt|sid/i.test(c))
      : false;

    const isRedirectToSafePage =
      headers["location"] &&
      ["/dashboard", "/account", "/home"].some((p) =>
        headers["location"]?.toLowerCase()?.includes(p)
      );

    let score = 0;
    if (status >= 200 && status < 300) score += 1;
    if (hasSuccessIndicators) score += 2;
    if (hasSessionCookie) score += 2;
    if (status === 302 && isRedirectToSafePage) score += 1;

    return !hasFailureIndicators && score >= 3;
  }

  function checkProgressiveDelay() {
    if (requestTimes.length < 6) return;

    const half = Math.floor(requestTimes.length / 2);
    const firstHalf = requestTimes.slice(0, half);
    const secondHalf = requestTimes.slice(half);

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgFirst = avg(firstHalf);
    const avgSecond = avg(secondHalf);

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
      console.warn(`[BRUTE SKIPPED] Missing username/password fields for ${url}`);
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

          // Rate limit detection
          if (resp.status === 429) {
            rateLimitDetected = true;
            noteFinding("rate_limit_detected", url, "429 Too Many Requests encountered", {
              confidence: "high",
              severity: "medium",
            });
            break;
          }

          // Captcha detection
          if (detectCaptcha(resp)) {
            noteFinding(
              "captcha_detected",
              url,
              "Possible captcha found after repeated login attempts",
              { confidence: "high", severity: "medium" }
            );
          }

          // Account lockout detection
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

          // Potential successful login
          if (isPotentiallySuccessfulLogin(resp)) {
            noteFinding(
              "default_or_weak_creds",
              url,
              `Logged in with a known weak credential: ${user}:${pass}`,
              { confidence: "high", severity: "high" }
            );
            successfulAttempts.push({ username: user, password: pass, url, status: resp.status });
            // We do NOT break, because we can try other combos
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

    const allPayloads = [...SQLI_PAYLOADS, ...PARAM_TAMPERING_PAYLOADS];
    const targetFields = Object.keys(formData);
    if (targetFields.length === 0) {
      return;
    }

    for (const fieldName of targetFields) {
      for (const payload of allPayloads) {
        const injected = { ...formData, [fieldName]: payload };
        try {
          const resp = await requestFn(actionUrl, method, injected);
          const $ = cheerio.load(resp.data);
          const result = detectPatterns($);

          if (result) {
            console.log(
              `[PAYLOAD FOUND] ${actionUrl} - ${fieldName}: ${payload}`,
              result.detections || []
            );
            if (result.detections) {
              const detectionTypes = result.detections.map((d) => d.type);
              noteFinding(
                "possible_injection_response",
                actionUrl,
                `Payload "${payload}" triggered patterns: ${detectionTypes.join(", ")}`,
                {
                  confidence: result.confidence || "medium",
                  severity: result.severity || "medium",
                }
              );
            } else {
              noteFinding(
                "possible_injection_response",
                actionUrl,
                `Payload "${payload}" triggered injection-like pattern`,
                {
                  confidence: "medium",
                  severity: "medium",
                }
              );
            }
          }
        } catch (err) {
          console.error(`[PAYLOAD FAIL] ${actionUrl}`, err.message);
        }
      }
    }

    return;
  }

  async function processForms($, url, requestFn) {
    const forms = extractForms($, url);

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

      // Try SQLi / param tampering
      await submitFormWithPayloads(form, requestFn);

      // Attempt brute-forcing if it’s a login form
      if (form.isLogin) {
        const bfAttempts = await bruteForceLogin(
          form.actionUrl,
          form.method,
          form.formData,
          form.formInputs,
          requestFn
        );

        // If we have successful logins, check for JWT tampering
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

    return;
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
        return error.response;
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
            // Mark this page as visited
            visitedUrls.set(pageUrl, res.$);
            foundUrls.add(pageUrl);

            // 1) Add to partialData
            partialData.crawledUrls.push(pageUrl);
            updatePartialData();

            // 2) Perform some basic checks
            await checkHTTPS(pageUrl);
            checkForPasswordReset(pageUrl);
            checkCredentialsInUrl(pageUrl);

            // 3) Gather new links
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
  // Main function flow
  // ------------------------
  try {
    // 1) Crawl the site
    const crawledUrls = await startCrawler(startUrl);

    // 2) Then, for each visited page, attempt to process forms
    for (const url of crawledUrls) {
      const $ = visitedUrls.get(url);
      if (!$) continue;

      await processForms($, url, requestFn);
    }

    /**
     * Ressources recommandées pour l'implémentation des mesures anti-bruteforce
     */
    const securityResources = {
      rateLimiting: [
        {
          title: "Express Rate Limit",
          url: "https://github.com/express-rate-limit/express-rate-limit",
          description: "Middleware Node.js/Express pour limiter le nombre de requêtes",
        },
        {
          title: "Rate Limiting avec Nginx",
          url: "https://www.nginx.com/blog/rate-limiting-nginx/",
          description: "Configuration du rate limiting au niveau du serveur web",
        },
        {
          title: "Guide OWASP sur le Rate Limiting",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html#rate-limiting",
          description: "Bonnes pratiques pour l'implémentation du rate limiting",
        },
      ],
      progressiveDelay: [
        {
          title: "Temporisation Progressive avec bcrypt",
          url: "https://github.com/kelektiv/node.bcrypt.js#a-note-on-rounds",
          description:
            "Utiliser bcrypt pour créer une temporisation naturelle dans le processus d'authentification",
        },
        {
          title: "Implémentation de délais exponentiels",
          url: "https://en.wikipedia.org/wiki/Exponential_backoff",
          description: "Implémentation d'algorithmes de backoff exponentiel",
        },
      ],
      captcha: [
        {
          title: "Google reCAPTCHA",
          url: "https://www.google.com/recaptcha/about/",
          description: "Service de CAPTCHA facile à implémenter et efficace",
        },
        {
          title: "hCaptcha",
          url: "https://www.hcaptcha.com/",
          description: "Alternative à reCAPTCHA respectueuse de la vie privée",
        },
        {
          title: "Guide d'intégration de CAPTCHA avec React",
          url: "https://developers.google.com/recaptcha/docs/display",
          description: "Documentation pour l'intégration de reCAPTCHA dans une application web",
        },
      ],
      accountLockout: [
        {
          title: "Guide OWASP sur le verrouillage de compte",
          url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#account-lockout",
          description: "Recommandations pour l'implémentation sécurisée du verrouillage de compte",
        },
        {
          title: "Passport.js - Stratégies d'authentification",
          url: "http://www.passportjs.org/",
          description:
            "Framework pour l'authentification dans Node.js avec support pour le verrouillage de compte",
        },
      ],
      generalSecurity: [
        {
          title: "OWASP Top 10",
          url: "https://owasp.org/www-project-top-ten/",
          description: "Les dix risques de sécurité les plus critiques pour les applications web",
        },
        {
          title: "Auth0 - Sécurité de l'authentification",
          url: "https://auth0.com/blog/",
          description: "Articles et guides sur la sécurité de l'authentification",
        },
        {
          title: "MDN - Sécurité des applications web",
          url: "https://developer.mozilla.org/en-US/docs/Web/Security",
          description: "Documentation complète sur la sécurité web",
        },
      ],
    };

    const findingToRecommendation = {
      no_rate_limit_detected: {
        id: "rateLimiting",
        text: "Implémenter un rate limiting sur tous les formulaires d'authentification",
        priority: "Haute",
      },
      progressive_delay_detected: {
        id: "progressiveDelay",
        text: "Ajouter une temporisation progressive après des échecs successifs",
        priority: "Moyenne",
      },
      default_or_weak_creds: {
        id: "accountLockout",
        text: "Mettre en place un verrouillage temporaire de compte après multiple échecs",
        priority: "Moyenne",
      },
      csrf_token_missing: {
        id: "generalSecurity",
        text: "Ajouter un token CSRF dans les formulaires sensibles",
        priority: "Haute",
      },
      improper_jwt_handling: {
        id: "generalSecurity",
        text: "Vérifier la configuration des JWT (signature, algorithme)",
        priority: "Haute",
      },
      insecure_transport: {
        id: "generalSecurity",
        text: "Rediriger automatiquement vers HTTPS",
        priority: "Critique",
      },
      credentials_in_url: {
        id: "generalSecurity",
        text: "Éviter de transmettre des informations sensibles dans les paramètres d'URL (ex: tokens, mots de passe)",
        priority: "Haute",
      },
      insecure_cookie: {
        id: "generalSecurity",
        text: "Configurer les cookies sensibles avec les attributs Secure et HttpOnly",
        priority: "Haute",
      },
      potential_insecure_reset: {
        id: "generalSecurity",
        text: "S'assurer que les flux de réinitialisation de mot de passe sont sécurisés (token à usage unique, expiration rapide)",
        priority: "Moyenne",
      },
      sql_injection_response: {
        id: "generalSecurity",
        text: "Utiliser des requêtes paramétrées pour toutes les entrées utilisateur afin d'éviter les injections SQL",
        priority: "Critique",
      },
      possible_injection_response: {
        id: "generalSecurity",
        text: "Utiliser des requêtes paramétrées pour toutes les entrées utilisateur afin d'éviter les injections SQL",
        priority: "Critique",
      },
      testing_string_response: {
        id: "generalSecurity",
        text: "Éviter de renvoyer des messages d'erreur contenant des informations internes ou de debug",
        priority: "Moyenne",
      },
    };

    function generateSummaryReport(findings) {
      const recommendations = [];
      const resourceSet = new Set();

      for (const vuln of findings) {
        const rec = findingToRecommendation[vuln.type];
        if (rec) {
          recommendations.push(rec);
          resourceSet.add(rec.id);
        }
      }

      const resources = {};
      for (const id of resourceSet) {
        resources[id] = securityResources[id];
      }

      return {
        recommendations,
        resources,
        totalFindings: findings.length,
      };
    }

    partialData.recommendationReport = generateSummaryReport(partialData.securityFindings);

    console.log("[runAudit] Finished crawling and processing forms.");
    // Return the final partialData (which should also be in the map)
    return partialData;
  } catch (err) {
    console.error("[runAudit] Unexpected error:", err);
    throw err;
  }
}
