import axios from "axios";
import * as cheerio from "cheerio";
import { detectSQLInjectionResponses, detectTestingStringResponses } from "./sqlInjections";
import { detectReflectedXSSResponses, detectStoredXSSResponses } from "./xssInjections";
import { checkCookiesForSecurityFlags } from "../authChecks";

const INJECTION_MARKER = "57ddbd5f-a702-4b94-8c1f-0741741a34fb_TESTING";
const SQLI_PAYLOADS = [
  `' UNION SELECT '${INJECTION_MARKER}', NULL -- `,
  `' OR '${INJECTION_MARKER}' = '${INJECTION_MARKER}' -- `,
];
const PARAM_TAMPERING_PAYLOADS = ["9999", "1 OR 1=1", "<script>alert('x')</script>"];
const USER_LIST = ["root", "admin"];
const PASSWORD_LIST = ["123456", "password", "12345678"];
const XSS_PAYLOADS = [
  "<script>alert('XSS')</script>",
  "<img src=x onerror=alert('XSS')>",
  "<svg onload=alert('XSS')>",
  "<iframe src='javascript:alert(1)'></iframe>",
  "<a href='javascript:alert(1)'>Click me</a>",
];

/**
 * Detects SQL injection or reflected marker patterns in response body.
 *
 * @param {cheerio.Root} $ - cheerio-parsed HTML document
 * @returns {object|null} structured detection result or null
 */
export function detectPatterns($) {
  const detections = [
    detectSQLInjectionResponses, detectTestingStringResponses,
    detectReflectedXSSResponses, detectStoredXSSResponses
  ]
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

/**
 * Builds mock form data for all fields, injecting a payload into the specified field.
 *
 * @param {object} originalFormData - Original form values
 * @param {object} formInputs - Field types mapping
 * @param {string} injectionField - Name of the field to inject
 * @param {string} payload - Injection payload
 * @returns {object} modified form data
 */
export function buildMockFormData(originalFormData, formInputs, injectionField, payload) {
  const mockData = { ...originalFormData };

  for (const fieldName in mockData) {
    if (fieldName === injectionField) {
      mockData[fieldName] = payload;
    } else {
      const type = formInputs[fieldName] || "";
      mockData[fieldName] = getDefaultValueByType(type);
    }
  }
  return mockData;
}

/**
 * Returns a default mock value based on input field type.
 *
 * @param {string} type - Field input type
 * @returns {string} dummy value
 */
export function getDefaultValueByType(type) {
  const defaultValues = {
    text: "ExampleText",
    password: "P@ssw0rd!",
    email: "test@example.com",
    url: "https://example.com",
    tel: "1234567890",
    number: "42",
    search: "search term",
    date: "2025-04-15",
    "datetime-local": "2025-04-15T10:30",
    month: "2025-04",
    week: "2025-W15",
    time: "10:30",
    color: "#ff0000",
    checkbox: "on",
    radio: "on",
    range: "50",
    file: "",
    hidden: "hiddenValue",
    submit: "",
    button: "",
    "select-one": "option1",
    "select-multiple": "option1,option2",
    textarea: "Example multiline text",
  };

  return defaultValues[type.toLowerCase()] || "dummyValue";
}

/**
 * Sends form submissions with various payloads to detect vulnerability response patterns.
 *
 * @param {object} form - Parsed form metadata
 * @param {Function} noteFinding - Finding logger
 */
export async function submitFormWithPayloads(form, noteFinding) {
  const { actionUrl, method, formData, formInputs } = form;
  const allPayloads = [...SQLI_PAYLOADS,  ...PARAM_TAMPERING_PAYLOADS, ...XSS_PAYLOADS];

  for (const field of Object.keys(formData)) {
    for (const payload of allPayloads) {
      const modifiedData = buildMockFormData(formData, formInputs, field, payload);
      try {
        const resp = await sendRequest(actionUrl, method, modifiedData);
        const $ = cheerio.load(resp.data);
        const result = detectPatterns($);

        if (result) {
          const typeList = result.detections?.map((d) => d.type) || [];
          noteFinding(
            "possible_injection_response",
            actionUrl,
            `Payload "${payload}" triggered patterns: ${typeList.join(", ")}`,
            {
              confidence: result.confidence || "medium",
              severity: result.severity || "medium",
            }
          );
        }
      } catch (err) {
        console.error(`[Payload Error] ${actionUrl} field '${field}'`, err.message);
      }
    }
  }
}

/**
 * Attempts brute-force login with common credentials.
 * Detects successful logins and potential rate limit / lockout mechanisms.
 *
 * @param {object} form - Form structure metadata
 * @param {Function} noteFinding - Finding logger
 * @returns {Promise<Array>} successful attempts
 */
export async function bruteForceLogin(form, noteFinding) {
  const { actionUrl, method, formData, formInputs } = form;
  const usernameField = Object.keys(formInputs).find(
    (name) => name.toLowerCase().includes("user") || name.toLowerCase().includes("email")
  );
  const passwordField = Object.keys(formInputs).find((name) => formInputs[name] === "password");

  const successful = [];
  if (!usernameField || !passwordField) return successful;

  let requestTimes = [];
  let rateLimitDetected = false;
  let accountLockoutDetected = false;

  for (const user of USER_LIST) {
    for (const pass of PASSWORD_LIST) {
      const payload = { ...formData, [usernameField]: user, [passwordField]: pass };
      const start = Date.now();
      try {
        const resp = await sendRequest(actionUrl, method, payload);
        const duration = Date.now() - start;
        requestTimes.push(duration);
        detectProgressiveDelay(noteFinding, requestTimes);

        if (resp.status === 429 && !rateLimitDetected) {
          rateLimitDetected = true;
          noteFinding("rate_limit_detected", actionUrl, "429 Too Many Requests encountered", {
            confidence: "high",
            severity: "medium",
          });
          break;
        }

        if (detectCaptcha(resp)) {
          noteFinding(
            "captcha_detected",
            actionUrl,
            "Possible captcha found after repeated login attempts",
            { confidence: "high", severity: "medium" }
          );
        }

        if (detectAccountLockout(resp) && !accountLockoutDetected) {
          accountLockoutDetected = true;
          noteFinding(
            "account_lockout_detected",
            actionUrl,
            "Server indicates account lockout after repeated attempts",
            { confidence: "high", severity: "medium" }
          );
          break;
        }

        if (isPotentiallySuccessfulLogin(resp, noteFinding)) {
          noteFinding(
            "default_or_weak_creds",
            actionUrl,
            `Logged in with default credentials: ${user}/${pass}`,
            { confidence: "high", severity: "high" }
          );
          successful.push({ user, pass, url: actionUrl, method, payload });
        }
      } catch (err) {
        console.error(`[Brute Force Error] ${user}/${pass}`, err.message);
      }
    }
    if (rateLimitDetected || accountLockoutDetected) break;
  }

  if (!rateLimitDetected && !accountLockoutDetected && requestTimes.length > USER_LIST.length) {
    noteFinding(
      "no_rate_limit_detected",
      actionUrl,
      "No 429 or lockout after many brute-force attempts",
      { confidence: "medium", severity: "medium" }
    );
  }

  return successful;
}

/**
 * Determines whether a login attempt likely succeeded, based on response patterns.
 *
 * @param {import("axios").AxiosResponse} resp - The response object
 * @param {Function} noteFinding - Logger for cookie issues
 * @returns {boolean} success heuristic
 */
export function isPotentiallySuccessfulLogin(resp, noteFinding) {
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

  checkCookiesForSecurityFlags(headers["set-cookie"], resp.config?.url || "N/A", noteFinding);

  const setCookieHeader = headers["set-cookie"];
  const hasSessionCookie = Array.isArray(setCookieHeader)
    ? setCookieHeader.some((c) => /session|auth|jwt|sid/i.test(c))
    : false;

  const isRedirectToSafePage =
    headers["location"] &&
    ["/dashboard", "/account", "/home"].some((p) => headers["location"].toLowerCase().includes(p));

  let score = 0;
  if (status >= 200 && status < 300) score += 1;
  if (hasSuccessIndicators) score += 2;
  if (hasSessionCookie) score += 2;
  if (status === 302 && isRedirectToSafePage) score += 1;

  return !hasFailureIndicators && score >= 3;
}

/**
 * Checks for progressively slower response times to infer rate limiting.
 *
 * @param {Function} noteFinding - Logger
 * @param {number[]} requestTimes - Array of response durations in ms
 */
export function detectProgressiveDelay(noteFinding, requestTimes = []) {
  let progressiveDelayDetected = false;

  if (requestTimes.length < 6) return;
  const half = Math.floor(requestTimes.length / 2);
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const avgFirst = avg(requestTimes.slice(0, half));
  const avgSecond = avg(requestTimes.slice(half));

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

/**
 * Detects visual or keyword-based indicators of CAPTCHA in the HTML.
 *
 * @param {import("axios").AxiosResponse} resp - Axios response
 * @returns {boolean} true if captcha detected
 */
export function detectCaptcha(resp) {
  const $ = cheerio.load(resp.data);
  return (
    $('[class*="captcha"]').length > 0 ||
    $('[id*="captcha"]').length > 0 ||
    $('img[src*="captcha"]').length > 0 ||
    $('div[class*="g-recaptcha"]').length > 0
  );
}

/**
 * Scans HTML for common lockout phrases or status code indicating account lock.
 *
 * @param {import("axios").AxiosResponse} resp - Axios response
 * @returns {boolean} true if account lockout detected
 */
export function detectAccountLockout(resp) {
  const html = (resp.data || "").toLowerCase();
  const status = resp.status;
  if (status === 403) return true;
  const lockoutPatterns = [
    /account.*locked/i,
    /locked.*account/i,
    /too many.*attempts/i,
    /temporarily blocked/i,
    /verrouill/i,
    /bloqu/i,
    /trop de tentatives/i,
  ];
  return lockoutPatterns.some((re) => re.test(html));
}

/**
 * Sends a GET or POST request with appropriate headers.
 *
 * @param {string} url - Endpoint to call
 * @param {string} method - HTTP method (GET or POST)
 * @param {object} data - Query or form body
 * @returns {Promise<import("axios").AxiosResponse>} Response object
 */
export async function sendRequest(url, method, data) {
  const config = {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || [302, 429].includes(status),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  };

  if (method === "POST") {
    return await axios.post(url, new URLSearchParams(data), config);
  } else {
    const qs = new URLSearchParams(data).toString();
    return await axios.get(`${url}?${qs}`, config);
  }
}
