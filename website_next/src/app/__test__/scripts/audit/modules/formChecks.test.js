import * as formChecks from "../../../../../scripts/audit/modules/formChecks";
import * as securityChecks from "../../../../../scripts/audit/modules/securityChecks";
import * as authChecks from "../../../../../scripts/audit/modules/authChecks";
const cheerio = require("cheerio");
const axios = require("axios");
jest.mock("axios");
jest.mock("../../../../../scripts/audit/modules/securityChecks");
jest.mock("../../../../../scripts/audit/modules/authChecks");

describe("formChecks", () => {
  const mockNoteFinding = jest.fn();
  const baseUrl = "http://example.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractForms", () => {
    it("should extract form metadata correctly", () => {
      const html = `
        <form method="POST" action="/login">
          <input type="text" name="username" />
          <input type="password" name="password" />
          <input type="hidden" name="csrf_token" value="123" />
        </form>`;
      const $ = cheerio.load(html);
      const forms = formChecks.extractForms($, baseUrl);

      expect(forms.length).toBe(1);
      expect(forms[0].method).toBe("POST");
      expect(forms[0].actionUrl).toContain("/login");
      expect(forms[0].formInputs).toHaveProperty("username");
      expect(forms[0].hasCSRFToken).toBe(true);
      expect(forms[0].isLogin).toBe(true);
    });

    it("should handle relative and absolute action URLs", () => {
      const html = `<form action="https://external.com/submit"><input name="x" /></form>`;
      const $ = cheerio.load(html);
      const forms = formChecks.extractForms($, baseUrl);
      expect(forms[0].actionUrl).toBe("https://external.com/submit");
    });
  });

  describe("checkFormForCSRFToken", () => {
    it("should return true if CSRF token input exists", () => {
      const html = `<form><input type='hidden' name='csrf_token' value='abc' /></form>`;
      const $ = cheerio.load(html);
      const result = formChecks.checkFormForCSRFToken($("form"));
      expect(result).toBe(true);
    });

    it("should return false if CSRF token input is missing", () => {
      const html = `<form><input type='text' name='username' /></form>`;
      const $ = cheerio.load(html);
      const result = formChecks.checkFormForCSRFToken($("form"));
      expect(result).toBe(false);
    });
  });

  describe("isLikelyLoginForm", () => {
    it("should return true for forms with user and password inputs", () => {
      const html = `
        <form>
          <input type='text' name='email' />
          <input type='password' name='password' />
        </form>`;
      const $ = cheerio.load(html);
      const result = formChecks.isLikelyLoginForm($("form"), $);
      expect(result).toBe(true);
    });

    it("should return false for forms without login fields", () => {
      const html = `<form><input type='text' name='search' /></form>`;
      const $ = cheerio.load(html);
      const result = formChecks.isLikelyLoginForm($("form"), $);
      expect(result).toBe(false);
    });

    it("should detect login form with just user input and password", () => {
      const html = `<form><input type='email' name='user' /><input type='password' name='pass' /></form>`;
      const $ = cheerio.load(html);
      const result = formChecks.isLikelyLoginForm($("form"), $);
      expect(result).toBe(true);
    });
  });

  describe("sendRequestWithJWT", () => {
    it("should send a GET request with JWT token in Cookie header", async () => {
      const mockGet = jest.fn().mockResolvedValue({ status: 200 });
      axios.get = mockGet;

      const token = "tampered.jwt.token";
      const url = "https://example.com";
      await formChecks.sendRequestWithJWT(url, token);

      expect(mockGet).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          headers: expect.objectContaining({ Cookie: `jwt=${token}` }),
        })
      );
    });
  });

  describe("processForms", () => {
    it("should handle JWT logic and CSRF token detection", async () => {
      const html = `<form method="POST" action="/login">
        <input type="text" name="user" />
        <input type="password" name="password" />
      </form>`;

      const $ = cheerio.load(html);
      const dummyToken = "jwt.token.value";
      const successResp = {
        url: baseUrl,
        method: "POST",
        payload: { user: "root", password: "123456" },
      };

      securityChecks.submitFormWithPayloads.mockResolvedValue();
      securityChecks.bruteForceLogin.mockResolvedValue([successResp]);
      securityChecks.sendRequest.mockResolvedValue({
        headers: { "set-cookie": [`jwt=${dummyToken};`] },
        status: 200,
      });

      authChecks.parseJWTFromCookie.mockReturnValue(dummyToken);
      authChecks.attemptJWTExploitation.mockResolvedValue();

      await formChecks.processForms($, baseUrl, mockNoteFinding);

      expect(securityChecks.submitFormWithPayloads).toHaveBeenCalled();
      expect(securityChecks.bruteForceLogin).toHaveBeenCalled();
      expect(authChecks.parseJWTFromCookie).toHaveBeenCalled();
      expect(authChecks.attemptJWTExploitation).toHaveBeenCalled();
    });

    it("should skip CSRF and brute force for non-login forms", async () => {
      const html = `<form method="POST" action="/newsletter">
        <input type="email" name="email" />
      </form>`;

      const $ = cheerio.load(html);
      await formChecks.processForms($, baseUrl, mockNoteFinding);

      expect(securityChecks.bruteForceLogin).not.toHaveBeenCalled();
      expect(mockNoteFinding).not.toHaveBeenCalledWith(
        "csrf_token_missing",
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});
