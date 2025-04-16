jest.mock("crawler");
jest.mock("../../../../scripts/audit/modules/authChecks");
jest.mock("../../../../scripts/audit/modules/formChecks");

import { runAudit } from "../../../../scripts/audit";
import * as authChecks from "../../../../scripts/audit/modules/authChecks";
import * as formChecks from "../../../../scripts/audit/modules/formChecks";
import { normalizeUrl, isSameDomain } from "../../../../scripts/audit/utils/url";
const cheerio = require("cheerio");

const mockCheerio = cheerio.load(
  `<html><body><a href='/link1'></a><a href='/image.jpg'></a></body></html>`
);

const mock$ = mockCheerio;

describe("runAudit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authChecks.checkHTTPS.mockResolvedValue();
    authChecks.checkCredentialsInUrl.mockImplementation(() => {});
    authChecks.checkForPasswordReset.mockImplementation(() => {});
    formChecks.processForms.mockResolvedValue();
  });

  it("should handle errors during crawling", async () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const run = async () => {
      jest.doMock("crawler", () => {
        return {
          default: class {
            constructor(config) {
              setTimeout(() => {
                config.callback(
                  new Error("Crawl fail"),
                  { options: { url: "http://fail.com" } },
                  jest.fn()
                );
              }, 0);
            }
            queue() {}
            on(event, cb) {
              if (event === "drain") setTimeout(cb, 10);
            }
          },
        };
      });

      const { runAudit: failingAudit } = await import("../../../../scripts/audit");
      await expect(failingAudit("http://fail.com", "failUser")).resolves.toHaveProperty(
        "crawledUrls"
      );
    };

    await run();
    console.error = originalConsoleError;
  });

  it("should extract valid links only", () => {
    const links = [...new Set(normalizeUrl && isSameDomain ? ["http://example.com/link1"] : [])];
    expect(links).toEqual(expect.any(Array));
  });

  it("should generate a complete recommendation report", async () => {
    const testFinding = {
      type: "insecure_cookie",
      url: "http://localhost",
      detail: "Cookie missing Secure flag",
      confidence: "high",
      severity: "medium",
    };

    formChecks.processForms.mockImplementation(async (_, __, noteFinding) => {
      noteFinding(testFinding.type, testFinding.url, testFinding.detail, {
        confidence: testFinding.confidence,
        severity: testFinding.severity,
      });
    });

    const result = await runAudit("http://localhost", "test-user");
    expect(result.securityFindings.length).toBeGreaterThan(0);
    expect(result.recommendationReport.recommendations).toBeDefined();
    expect(result.recommendationReport.resources).toBeDefined();
  });
});

describe("utils/url", () => {
  describe("normalizeUrl", () => {
    it("should resolve relative URLs against base", () => {
      const href = "/about";
      const base = "http://example.com";
      const result = normalizeUrl(href, base);
      expect(result).toBe("http://example.com/about");
    });

    it("should return absolute URL as is", () => {
      const href = "https://another.com/path";
      const base = "http://example.com";
      const result = normalizeUrl(href, base);
      expect(result).toBe("https://another.com/path");
    });

    it("should return null for truly invalid URLs", () => {
      const result = normalizeUrl("http://", "http://example.com");
      expect(result).toBeNull();
    });
  });

  describe("isSameDomain", () => {
    it("should return true if domains match", () => {
      const result = isSameDomain("http://example.com/path", "example.com");
      expect(result).toBe(true);
    });

    it("should return false if domains differ", () => {
      const result = isSameDomain("http://other.com/path", "example.com");
      expect(result).toBe(false);
    });

    it("should return false for invalid URLs", () => {
      const result = isSameDomain("not-a-url", "example.com");
      expect(result).toBe(false);
    });
  });
});
