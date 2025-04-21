jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      headers: init.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}));

// Mock prisma client
jest.mock("@prisma/client", () => {
  const mockFindFirst = jest.fn();
  return {
    PrismaClient: jest.fn(() => ({
      scan: {
        findFirst: mockFindFirst,
      },
    })),
  };
});

jest.mock("@/scripts/audit/utils/findings", () => {
  const original = jest.requireActual("@/scripts/audit/utils/findings");
  return {
    ...original,
    generateSummaryReport: jest.fn(() => ({
      recommendations: [{ id: "generalSecurity", text: "Fix stuff", priority: "high" }],
      resources: { generalSecurity: [] },
      totalFindings: 2,
    })),
  };
});

describe("GET /api/scan/status", () => {
  const userId = 999;

  const mockRequest = (cookie) => ({
    headers: {
      get: () => cookie,
    },
  });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 401 if JWT token is missing", async () => {
    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest(""));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/missing jwt/i);
  });

  it("returns 401 if JWT token is invalid", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=bad.token"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns not_started if no scan found", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    const { PrismaClient } = require("@prisma/client");
    PrismaClient().scan.findFirst.mockResolvedValue(null);

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isRunning: false,
      status: "not_started",
      scanResults: {},
    });
  });

  it("returns current scan status and generates a report if scanResult exists", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    const { PrismaClient } = require("@prisma/client");
    PrismaClient().scan.findFirst.mockResolvedValue({
      status: "success",
      isRunning: false,
      scanResult: {
        crawledUrls: [{ url: "https://example.com" }],
        findings: [
          {
            type: "csrf_token_missing",
            url: "https://example.com/login",
            detail: "Missing CSRF token",
            confidence: "medium",
            severity: "high",
          },
          {
            type: "insecure_cookie",
            url: "https://example.com/auth",
            detail: "Cookie missing Secure flag",
            confidence: "high",
            severity: "medium",
          },
        ],
      },
    });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("success");
    expect(data.isRunning).toBe(false);
    expect(data.scanResults.crawledUrls).toEqual([{ url: "https://example.com" }]);
    expect(data.scanResults.securityFindings).toHaveLength(2);
    expect(data.scanResults.recommendationReport.totalFindings).toBe(2);
    expect(data.scanResults.recommendationReport.recommendations.length).toBeGreaterThan(0);
  });
});
