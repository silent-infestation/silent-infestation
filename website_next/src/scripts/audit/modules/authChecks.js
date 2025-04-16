import axios from "axios";
import * as jwt from "jsonwebtoken";

/**
 * Checks if the given page uses HTTPS or redirects to it.
 *
 * @param {string} pageUrl - The page URL to verify
 * @param {Function} noteFinding - Logger function for findings
 * @returns {Promise<void>}
 */
export async function checkHTTPS(pageUrl, noteFinding) {
  if (pageUrl.toLowerCase().startsWith("https://")) return;
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
  } catch {
    noteFinding("insecure_transport", pageUrl, "Site does not use HTTPS (HEAD check failed)", {
      confidence: "medium",
      severity: "medium",
    });
  }
}

/**
 * Scans the query parameters of the URL to detect exposed credentials.
 *
 * @param {string} pageUrl - URL to inspect
 * @param {Function} noteFinding - Logger function for findings
 */
export function checkCredentialsInUrl(pageUrl, noteFinding) {
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

/**
 * Detects URL patterns typically associated with password reset features.
 *
 * @param {string} pageUrl - URL string
 * @param {Function} noteFinding - Logger function for findings
 */
export function checkForPasswordReset(pageUrl, noteFinding) {
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
 * Validates cookies for security flags like Secure and HttpOnly.
 *
 * @param {string[]|string} setCookieHeader - Raw Set-Cookie header(s)
 * @param {string} pageUrl - Originating URL of the response
 * @param {Function} noteFinding - Logger function for findings
 */
export function checkCookiesForSecurityFlags(setCookieHeader, pageUrl, noteFinding) {
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
      if (!lower.includes("secure") && domain !== "localhost") missingFlags.push("Secure");
      if (!lower.includes("httponly")) missingFlags.push("HttpOnly");

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

/**
 * Extracts JWT token from cookies if present.
 *
 * @param {string[]|string} setCookieHeader - The Set-Cookie header value(s)
 * @returns {string|null} extracted JWT token or null if not found
 */
export function parseJWTFromCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookieStr of cookieArray) {
    const match = cookieStr.match(/jwt=([^;]+)/i);
    if (match) return match[1];
  }
  return null;
}

/**
 * Attempts to bypass JWT validation using "alg: none" tampering.
 *
 * @param {string} originalToken - The original JWT token from cookies
 * @param {string} pageUrl - Page where the token was acquired
 * @param {Function} requestRestrictedFn - Function that makes a request with the tampered JWT
 * @param {Function} noteFinding - Logger function for findings
 * @returns {Promise<void>}
 */
export async function attemptJWTExploitation(
  originalToken,
  pageUrl,
  requestRestrictedFn,
  noteFinding
) {
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
    const tamperedToken = `${toBase64Url(tamperedHeader)}.${toBase64Url(payloadObj)}.`;
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
