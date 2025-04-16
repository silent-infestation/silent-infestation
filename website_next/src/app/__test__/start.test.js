jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      headers: init.headers || {},
      json: async () => data,
    })),
  },
}));

jest.mock("@/scripts/audit/index.js", () => ({
  runAudit: jest.fn().mockResolvedValue({ success: true }),
}));

const { NextResponse } = require("next/server");
const { verify } = require("jsonwebtoken");
const { runAudit } = require("@/scripts/audit/index");

const userId = 42;
const mockRequest = (cookie, jsonBody = { startUrl: "http://example.com" }) => ({
  headers: {
    get: () => cookie,
  },
  json: jest.fn().mockResolvedValue(jsonBody),
});

beforeEach(() => {
  jest.clearAllMocks();
  global.scanStatusMap = new Map();
  global.scanResultsMap = new Map();
});

describe("POST /api/launch-scan", () => {
  it("should return 401 if JWT token is missing", async () => {
    const { POST } = await import("@/app/api/launch-scan/route");
    const res = await POST(mockRequest(""));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/missing jwt/i);
  });

  it("should return 401 if JWT is invalid", async () => {
    verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { POST } = await import("@/app/api/launch-scan/route");
    const res = await POST(mockRequest("token=bad.token"));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/invalid/i);
  });

  it("should return 400 if startUrl is invalid", async () => {
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/launch-scan/route");
    const res = await POST(mockRequest("token=valid.token", { startUrl: "ftp://evil" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/must be a valid/i);
  });

  it("should return 400 if scan is already running", async () => {
    verify.mockReturnValue({ id: userId });
    global.scanStatusMap.set(userId, { isRunning: true, status: "running" });

    const { POST } = await import("@/app/api/launch-scan/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toMatch(/already running/i);
  });

  it("should start a scan and return 200", async () => {
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/launch-scan/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/scan started/i);
    expect(global.scanStatusMap.get(userId)).toEqual({
      isRunning: true,
      status: "running",
    });

    // Wait for background runAudit call to finish
    await new Promise((r) => setTimeout(r, 10));

    expect(runAudit).toHaveBeenCalledWith("http://example.com", userId);
    const finalStatus = global.scanStatusMap.get(userId);
    expect(["success", "error"]).toContain(finalStatus.status);
    expect(finalStatus.isRunning).toBe(false);
  });
});
