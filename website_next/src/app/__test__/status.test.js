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

describe("GET /api/scan (status)", () => {
  const userId = 999;

  const mockRequest = (cookie) => ({
    headers: {
      get: () => cookie,
    },
  });

  beforeEach(() => {
    jest.resetModules();
    global.scanStatusMap = new Map();
    global.scanResultsMap = new Map();
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

  it("returns not_started and null result if no previous scan data", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

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

  it("returns current scan status and results if available", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    global.scanStatusMap.set(userId, {
      isRunning: true,
      status: "running",
    });

    global.scanResultsMap.set(userId, {
      findings: ["xss", "csrf"],
    });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isRunning: true,
      status: "running",
      scanResults: {
        findings: ["xss", "csrf"],
      },
    });
  });
});
