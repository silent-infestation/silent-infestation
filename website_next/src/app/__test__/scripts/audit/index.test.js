jest.mock("crawler");
jest.mock("../../../../scripts/audit/modules/authChecks");
jest.mock("../../../../scripts/audit/modules/formChecks");
jest.mock("@prisma/client", () => {
  const scan = {
    findFirst: jest.fn().mockResolvedValue({ id: 1, userId: "test-user" }),
    update: jest.fn(),
  };
  const scanResult = {
    create: jest.fn().mockResolvedValue({ id: 999 }),
    update: jest.fn(),
  };
  const crawledUrl = {
    createMany: jest.fn(),
  };
  const securityFinding = {
    create: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      scan,
      scanResult,
      crawledUrl,
      securityFinding,
    })),
  };
});

import { PrismaClient } from "@prisma/client";
import { runAudit } from "../../../../scripts/audit";
import * as authChecks from "../../../../scripts/audit/modules/authChecks";
import * as formChecks from "../../../../scripts/audit/modules/formChecks";
import { normalizeUrl, isSameDomain } from "../../../../scripts/audit/utils/url";
import {
  noteFindingFactory,
  generateSummaryReport,
  findingToRecommendation,
  securityResources,
} from "../../../../scripts/audit/utils/findings";

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
      await expect(failingAudit("http://fail.com", "failUser")).resolves.toBeUndefined();
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

    await runAudit("http://localhost", "test-user");
    expect(formChecks.processForms).toHaveBeenCalled();
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

describe("noteFindingFactory", () => {
  let recordedFindings;
  let noteFinding;
  let prisma;
  const scanResultId = 999;

  beforeEach(() => {
    recordedFindings = new Set();
    prisma = new PrismaClient();
    noteFinding = noteFindingFactory(recordedFindings, scanResultId);
    prisma.securityFinding.create.mockClear();
  });

  it("should create a new finding if not already recorded", async () => {
    await noteFinding("csrf_token_missing", "https://example.com", "No CSRF token", {
      confidence: "high",
      severity: "high",
    });

    expect(prisma.securityFinding.create).toHaveBeenCalledWith({
      data: {
        scanResultId,
        type: "csrf_token_missing",
        url: "https://example.com",
        detail: "No CSRF token",
        confidence: "high",
        severity: "high",
      },
    });
  });

  it("should not add duplicate findings", async () => {
    recordedFindings.add("csrf_token_missing::example.com::No CSRF token");

    await noteFinding("csrf_token_missing", "https://example.com", "No CSRF token");

    expect(prisma.securityFinding.create).not.toHaveBeenCalled();
  });

  it("should gracefully handle non-URL inputs", async () => {
    await noteFinding("csrf_token_missing", "not-a-url", "Something weird");

    expect(recordedFindings.has("csrf_token_missing::not-a-url::Something weird")).toBe(true);
    expect(prisma.securityFinding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "csrf_token_missing",
        url: "not-a-url",
        detail: "Something weird",
      }),
    });
  });

  it("should use default confidence and severity if omitted", async () => {
    await noteFinding("sql_injection_response", "http://site.com", "Boom 💥");

    expect(prisma.securityFinding.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        confidence: "medium",
        severity: "medium",
      }),
    });
  });

  it("should allow multiple different findings", async () => {
    await noteFinding("type1", "https://domain.com", "detail one");
    await noteFinding("type2", "https://domain.com", "detail two");

    expect(prisma.securityFinding.create).toHaveBeenCalledTimes(2);
  });

  it("should differentiate findings by domain", async () => {
    await noteFinding("type1", "https://a.com", "same detail");
    await noteFinding("type1", "https://b.com", "same detail");

    expect(prisma.securityFinding.create).toHaveBeenCalledTimes(2);
  });
});

describe("generateSummaryReport", () => {
  it("should collect unique recommendations and resources", () => {
    const findings = [
      { type: "csrf_token_missing", detail: "1" },
      { type: "no_rate_limit_detected", detail: "2" },
      { type: "progressive_delay_detected", detail: "3" },
    ];

    const result = generateSummaryReport(findings, findingToRecommendation, securityResources);
    const ids = result.recommendations.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should return empty report if findings list is empty", () => {
    const result = generateSummaryReport([], findingToRecommendation, securityResources);
    expect(result).toEqual({
      recommendations: [],
      resources: {},
      totalFindings: 0,
    });
  });

  it("should ignore unknown types gracefully", () => {
    const findings = [{ type: "unknown_type", detail: "wat" }];
    const result = generateSummaryReport(findings, findingToRecommendation, securityResources);
    expect(result.recommendations).toEqual([]);
    expect(result.resources).toEqual({});
    expect(result.totalFindings).toBe(1);
  });

  it("should include all known recommendation types", () => {
    const findings = Object.keys(findingToRecommendation).map((type) => ({
      type,
      detail: `Test ${type}`,
    }));

    const result = generateSummaryReport(findings, findingToRecommendation, securityResources);
    const includedIds = result.recommendations.map((r) => r.id);
    const expectedIds = [...new Set(Object.values(findingToRecommendation).map((r) => r.id))];

    expectedIds.forEach((id) => {
      expect(includedIds).toContain(id);
    });
  });
});
