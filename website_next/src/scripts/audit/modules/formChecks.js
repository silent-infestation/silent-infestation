import { attemptJWTExploitation, parseJWTFromCookie } from "./authChecks";
import { submitFormWithPayloads, bruteForceLogin, sendRequest } from "./securityChecks";

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

export async function processForms($, url, noteFinding) {
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
    await submitFormWithPayloads(form, noteFinding);

    // Attempt brute-forcing if it’s a login form
    if (form.isLogin) {
      const bfAttempts = await bruteForceLogin(form, noteFinding);

      // If we have successful logins, check for JWT tampering
      for (const success of bfAttempts) {
        console.log("[Brute Force Success]", success);
        try {
          console.log(
            "[Brute Force Success] Attempting to exploit JWT:",
            success.url,
            success.method,
            success.payload
          );
          const loginResp = await sendRequest(success.url, success.method, success.payload);
          console.log(
            "[Login Response]",
            loginResp.status,
            loginResp.data,
            success.url,
            success.method,
            success.payload
          );
          const setCookie = loginResp.headers?.["set-cookie"];
          console.log(
            "[Set-Cookie]",
            setCookie,
            loginResp.headers,
            success.url,
            success.method,
            success.payload
          );
          const foundJwt = parseJWTFromCookie(setCookie);
          console.log(
            "[JWT Found]",
            foundJwt,
            loginResp.headers,
            success.url,
            success.method,
            success.payload
          );

          if (foundJwt) {
            console.log("[JWT Found] Attempting to exploit JWT:", foundJwt);
            console.log("success.url", success.url, "url", url);
            await attemptJWTExploitation(foundJwt, url, async (tamperedToken) => {
              return sendRequestWithJWT(success.url, tamperedToken);
            });
          }
        } catch (jwtErr) {
          console.error("[JWT Handling Error]", jwtErr.message);
        }
      }
    }
  }
}

function checkFormForCSRFToken($form) {
  return (
    $form.find("input[type='hidden'][name*='csrf'], input[type='hidden'][name*='token']").length > 0
  );
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
