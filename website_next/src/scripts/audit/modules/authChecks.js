// File: modules/authChecks.js

import axios from "axios";
import * as jwt from "jsonwebtoken";

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

export function parseJWTFromCookie(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookieArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  for (const cookieStr of cookieArray) {
    const match = cookieStr.match(/jwt=([^;]+)/i);
    if (match) return match[1];
  }
  return null;
}

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
