import axios from "axios";
import { attemptJWTExploitation, parseJWTFromCookie } from "./authChecks";
import { submitFormWithPayloads, bruteForceLogin, sendRequest } from "./securityChecks";

/**
 * Extracts all forms on a given page and returns metadata for each.
 *
 * @param {cheerio.Root} $ - The cheerio object representing the DOM
 * @param {string} pageUrl - The base URL for resolving form actions
 * @returns {Array<object>} List of parsed form objects
 */
export function extractForms($, pageUrl) {
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

/**
 * Processes each form on the page to test for CSRF, injection, brute-force and JWT vulnerabilities.
 *
 * @param {cheerio.Root} $ - The cheerio DOM object
 * @param {string} url - The URL of the page
 * @param {Function} noteFinding - Function to record any security findings
 */
export async function processForms($, url, noteFinding) {
  const forms = extractForms($, url);

  for (const form of forms) {
    if (form.isLogin && !form.hasCSRFToken) {
      noteFinding(
        "csrf_token_missing",
        form.actionUrl,
        "No hidden CSRF token found in a likely login form",
        { confidence: "medium", severity: "medium" }
      );
    }

    await submitFormWithPayloads(form, noteFinding);

    if (form.isLogin) {
      const bfAttempts = await bruteForceLogin(form, noteFinding);

      for (const success of bfAttempts) {
        try {
          const loginResp = await sendRequest(success.url, form.method, success.payload);
          const setCookie = loginResp.headers?.["set-cookie"];
          const foundJwt = parseJWTFromCookie(setCookie);

          if (foundJwt) {
            await attemptJWTExploitation(foundJwt, url, async (tamperedToken) => {
              return sendRequestWithJWT(success.url, tamperedToken);
            }, noteFinding);
          }
        } catch (jwtErr) {
          console.error("[JWT Handling Error]", jwtErr.message);
        }
      }
    }
  }
}

/**
 * Checks if a form has CSRF protection input fields.
 *
 * @param {cheerio.Cheerio} $form - Form element
 * @returns {boolean} true if CSRF token is present
 */
function checkFormForCSRFToken($form) {
  return (
    $form.find("input[type='hidden'][name*='csrf'], input[type='hidden'][name*='token']").length > 0
  );
}

/**
 * Heuristically determines if a form is likely to be a login form.
 *
 * @param {cheerio.Cheerio} $form - Form element
 * @param {cheerio.Root} $ - Cheerio root object
 * @returns {boolean} true if the form appears to be a login form
 */
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

/**
 * Makes a GET request using a tampered JWT token via the Cookie header.
 *
 * @param {string} url - Target URL
 * @param {string} tamperedToken - JWT token with altered signature
 * @returns {Promise<import("axios").AxiosResponse>} Response object
 */
async function sendRequestWithJWT(url, tamperedToken) {
  const config = {
    maxRedirects: 0,
    validateStatus: (status) => status < 400 || status === 302,
    headers: {
      Cookie: `jwt=${tamperedToken}`,
    },
  };
  return axios.get(url, config);
}
