import * as authChecks from "../../../../../scripts/audit/modules/authChecks";
import axios from "axios";
import jwt from "jsonwebtoken";

jest.mock("axios");
jest.mock("jsonwebtoken");

describe("authChecks", () => {
  const mockNoteFinding = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkHTTPS", () => {
    it("should skip HTTPS URLs", async () => {
      await authChecks.checkHTTPS("https://secure.com", mockNoteFinding);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });

    it("should report if site does not redirect to HTTPS", async () => {
      axios.head.mockResolvedValue({ headers: { location: "http://notsecure.com" } });
      await authChecks.checkHTTPS("http://test.com", mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "insecure_transport",
        "http://test.com",
        expect.any(String),
        expect.objectContaining({ confidence: "high", severity: "high" })
      );
    });

    it("should report if HTTPS check fails", async () => {
      axios.head.mockRejectedValue(new Error("fail"));
      await authChecks.checkHTTPS("http://fail.com", mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "insecure_transport",
        "http://fail.com",
        expect.any(String),
        expect.objectContaining({ confidence: "medium", severity: "medium" })
      );
    });
  });

  describe("checkCredentialsInUrl", () => {
    it("should flag sensitive info in query parameters", () => {
      const url = "http://test.com?token=secret123";
      authChecks.checkCredentialsInUrl(url, mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "credentials_in_url",
        url,
        expect.stringContaining("token=secret123"),
        expect.any(Object)
      );
    });

    it("should not throw on invalid URLs", () => {
      expect(() => authChecks.checkCredentialsInUrl("::::", mockNoteFinding)).not.toThrow();
    });
  });

  describe("checkForPasswordReset", () => {
    it("should detect reset flow in URL", () => {
      const url = "http://test.com/reset-password";
      authChecks.checkForPasswordReset(url, mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "potential_insecure_reset",
        url,
        expect.any(String),
        expect.any(Object)
      );
    });

    it("should not flag unrelated URLs", () => {
      authChecks.checkForPasswordReset("http://example.com/profile", mockNoteFinding);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });
  });

  describe("checkCookiesForSecurityFlags", () => {
    it("should detect missing Secure and HttpOnly flags", () => {
      const cookies = ["sessionid=abc123"];
      authChecks.checkCookiesForSecurityFlags(cookies, "http://site.com", mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "insecure_cookie",
        "http://site.com",
        expect.stringContaining("missing flags"),
        expect.any(Object)
      );
    });

    it("should only report missing HttpOnly for localhost", () => {
      const cookies = ["sessionid=abc123"];
      authChecks.checkCookiesForSecurityFlags(cookies, "http://localhost", mockNoteFinding);
      expect(mockNoteFinding).toHaveBeenCalledWith(
        "insecure_cookie",
        "http://localhost",
        expect.stringContaining("HttpOnly"),
        expect.any(Object)
      );
    });

    it("should handle non-session cookies gracefully", () => {
      authChecks.checkCookiesForSecurityFlags(["analytics=true"], "http://site.com", mockNoteFinding);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });

    it("should ignore invalid cookie formats", () => {
      authChecks.checkCookiesForSecurityFlags(["invalid_cookie_format"], "http://site.com", mockNoteFinding);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });
  });

  describe("parseJWTFromCookie", () => {
    it("should extract JWT from cookie", () => {
      const token = "header.payload.sig";
      const result = authChecks.parseJWTFromCookie(`jwt=${token}; Path=/;`);
      expect(result).toBe(token);
    });

    it("should return null if no JWT is found", () => {
      const result = authChecks.parseJWTFromCookie(["session=abc"]);
      expect(result).toBeNull();
    });
  });

  describe("attemptJWTExploitation", () => {
    it("should report improper JWT handling on success status", async () => {
      const jwtToken = "header.payload.sig";
      jwt.decode.mockReturnValue({ payload: { id: 1 } });

      const mockResp = { status: 200, headers: {} };
      const requestFn = jest.fn().mockResolvedValue(mockResp);

      await authChecks.attemptJWTExploitation(jwtToken, "http://target.com", requestFn, mockNoteFinding);

      expect(mockNoteFinding).toHaveBeenCalledWith(
        "improper_jwt_handling",
        "http://target.com",
        expect.any(String),
        expect.objectContaining({ confidence: "high" })
      );
    });

    it("should report redirect to protected route", async () => {
      jwt.decode.mockReturnValue({ payload: { id: 1 } });
      const requestFn = jest.fn().mockResolvedValue({
        status: 302,
        headers: { location: "/admin" },
      });

      await authChecks.attemptJWTExploitation("token", "http://target.com", requestFn, mockNoteFinding);

      expect(mockNoteFinding).toHaveBeenCalledWith(
        "improper_jwt_handling",
        "http://target.com",
        expect.any(String),
        expect.objectContaining({ severity: "critical" })
      );
    });

    it("should not report if decoding fails", async () => {
      jwt.decode.mockReturnValue(null);
      const requestFn = jest.fn();

      await authChecks.attemptJWTExploitation("badtoken", "http://x.com", requestFn, mockNoteFinding);
      expect(mockNoteFinding).not.toHaveBeenCalled();
    });
  });
});
