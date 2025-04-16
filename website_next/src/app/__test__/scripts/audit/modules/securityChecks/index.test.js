import * as securityChecks from "../../../../../../scripts/audit/modules/securityChecks";
import {
  isPotentiallySuccessfulLogin,
  detectCaptcha,
  detectAccountLockout,
  detectPatterns,
  sendRequest,
  bruteForceLogin,
  getDefaultValueByType,
  buildMockFormData,
  detectProgressiveDelay,
  submitFormWithPayloads,
} from "../../../../../../scripts/audit/modules/securityChecks";
import axios from "axios";
const cheerio = require("cheerio");

jest.mock("axios");
jest.mock("../../../../../../scripts/audit/modules/securityChecks/sqlInjections", () => ({
  detectSQLInjectionResponses: jest.fn(() => null),
  detectTestingStringResponses: jest.fn(() => null),
}));
jest.mock("../../../../../../scripts/audit/modules/authChecks", () => ({
  checkCookiesForSecurityFlags: jest.fn(),
}));

describe("securityChecks", () => {
  const mockNoteFinding = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isPotentiallySuccessfulLogin", () => {
    it("should detect successful login by response indicators", () => {
      const resp = {
        data: "Welcome to your dashboard",
        status: 200,
        headers: {
          "set-cookie": ["sessionid=12345; Secure; HttpOnly"],
          location: "/dashboard",
        },
        config: { url: "http://example.com" },
      };
      const result = isPotentiallySuccessfulLogin(resp, mockNoteFinding);
      expect(result).toBe(true);
    });

    it("should not detect login when failure keywords are present", () => {
      const resp = {
        data: "Invalid credentials",
        status: 200,
        headers: {},
        config: { url: "http://example.com" },
      };
      const result = isPotentiallySuccessfulLogin(resp, mockNoteFinding);
      expect(result).toBe(false);
    });

    it("should score low if no session cookie or keyword is present", () => {
      const resp = {
        data: "Login successful",
        status: 200,
        headers: {},
        config: { url: "http://example.com" },
      };
      const result = isPotentiallySuccessfulLogin(resp, mockNoteFinding);
      expect(result).toBe(false);
    });

    it("should detect login with redirect and session cookie only", () => {
      const resp = {
        data: "Some message",
        status: 302,
        headers: {
          location: "/account",
          "set-cookie": ["jwt=xyz"]
        },
        config: { url: "http://example.com" },
      };
      const result = isPotentiallySuccessfulLogin(resp, mockNoteFinding);
      expect(result).toBe(true);
    });

    it("should return false if session cookie missing and no keywords", () => {
      const resp = {
        data: "You are signed in",
        status: 302,
        headers: {
          location: "/home"
        },
        config: { url: "http://example.com" },
      };
      const result = isPotentiallySuccessfulLogin(resp, mockNoteFinding);
      expect(result).toBe(false);
    });
  });

  describe("detectCaptcha", () => {
    it("should detect captcha elements in response", () => {
      const resp = { data: '<div class="g-recaptcha"></div>' };
      const result = detectCaptcha(resp);
      expect(result).toBe(true);
    });

    it("should return false when no captcha is present", () => {
      const resp = { data: '<div class="login"></div>' };
      const result = detectCaptcha(resp);
      expect(result).toBe(false);
    });
  });

  describe("detectAccountLockout", () => {
    it("should detect 403 status as lockout", () => {
      const resp = { status: 403, data: "" };
      const result = detectAccountLockout(resp);
      expect(result).toBe(true);
    });

    it("should detect lockout phrases in body", () => {
      const resp = { status: 200, data: "Account locked due to too many attempts" };
      const result = detectAccountLockout(resp);
      expect(result).toBe(true);
    });

    it("should not detect lockout in normal text", () => {
      const resp = { status: 200, data: "Welcome to your profile" };
      const result = detectAccountLockout(resp);
      expect(result).toBe(false);
    });
  });

  describe("detectPatterns", () => {
    it("should return null when no patterns match", () => {
      const $ = cheerio.load("<html></html>");
      const result = detectPatterns($);
      expect(result).toBeNull();
    });
  });

  describe("sendRequest", () => {
    it("should send POST requests correctly", async () => {
      axios.post.mockResolvedValue({ status: 200 });
      const res = await sendRequest("http://x.com", "POST", { user: "admin" });
      expect(axios.post).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });

    it("should send GET requests correctly", async () => {
      axios.get.mockResolvedValue({ status: 200 });
      const res = await sendRequest("http://x.com", "GET", { user: "admin" });
      expect(axios.get).toHaveBeenCalled();
      expect(res.status).toBe(200);
    });
  });

  describe("getDefaultValueByType", () => {
    it("should return correct value for known types", () => {
      expect(getDefaultValueByType("email")).toBe("test@example.com");
      expect(getDefaultValueByType("text")).toBe("ExampleText");
    });

    it("should return 'dummyValue' for unknown type", () => {
      expect(getDefaultValueByType("custom")).toBe("dummyValue");
    });
  });

  describe("buildMockFormData", () => {
    it("should inject payload into correct field", () => {
      const formData = { username: "", password: "" };
      const formInputs = { username: "text", password: "password" };
      const result = buildMockFormData(formData, formInputs, "username", "test");
      expect(result.username).toBe("test");
      expect(result.password).toBe("P@ssw0rd!");
    });
  });

  describe("detectProgressiveDelay", () => {
    it("should call noteFinding on progressive delay", () => {
      const delays = [100, 120, 110, 200, 300, 350];
      detectProgressiveDelay(mockNoteFinding, delays);
      expect(mockNoteFinding).toHaveBeenCalled();
    });

    it("should not call noteFinding for short list", () => {
      const delays = [100, 105];
      detectProgressiveDelay(mockNoteFinding, delays);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });
  });

  describe("submitFormWithPayloads", () => {
    it("should call noteFinding on detected injection pattern", async () => {
      const mockForm = {
        actionUrl: "http://test.com",
        method: "POST",
        formData: { username: "", password: "" },
        formInputs: { username: "text", password: "password" },
      };
      axios.post.mockResolvedValue({ data: "<div></div>", status: 200 });
      require("../../../../../../scripts/audit/modules/securityChecks/sqlInjections").detectSQLInjectionResponses.mockReturnValue({
        type: "sql_injection_response",
      });

      await submitFormWithPayloads(mockForm, mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalled();
    });
  });

  describe("bruteForceLogin", () => {
    it("should detect successful login using default credentials", async () => {
      const mockForm = {
        actionUrl: "http://test.com",
        method: "POST",
        formData: { username: "", password: "" },
        formInputs: { username: "text", password: "password" },
      };

      axios.post.mockResolvedValue({
        data: "Welcome back",
        status: 200,
        headers: {
          "set-cookie": ["sessionid=12345"],
        },
        config: { url: "http://test.com" },
      });

      const result = await bruteForceLogin(mockForm, mockNoteFinding);
      expect(result.length).toBeGreaterThan(0);
      expect(mockNoteFinding).toHaveBeenCalled();
    });
  });
});
