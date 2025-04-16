import { jest } from "@jest/globals";

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

beforeAll(() => {
  // Declare before route import
  global.scanStatusMap = new Map();
  global.scanResultsMap = new Map();
});

beforeEach(() => {
  global.scanStatusMap.clear();
  global.scanResultsMap.clear();
  jest.clearAllMocks();
});

describe("POST /api/scan", () => {
  it("should return 401 if JWT token is missing", async () => {
    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest(""));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/missing jwt/i);
  });

  it("should return 401 if JWT is invalid", async () => {
    verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=bad.token"));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/invalid/i);
  });

  it("should return 400 if startUrl is invalid", async () => {
    verify.mockReturnValue({ id: userId });
    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token", { startUrl: "ftp://invalid" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/must be a valid/i);
  });

  it("should return 400 if scan is already running", async () => {
    global.scanStatusMap.set(userId, { isRunning: true, status: "running" });
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toMatch(/already running/i);
  });

  it("should start a scan and return 200", async () => {
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/scan started/i);
    expect(global.scanStatusMap.get(userId)).toEqual({
      isRunning: true,
      status: "running",
    });

    // Let the async scan complete
    await new Promise((r) => setTimeout(r, 10));

    expect(runAudit).toHaveBeenCalledWith("http://example.com", userId);
    const finalStatus = global.scanStatusMap.get(userId);
    expect(["success", "error"]).toContain(finalStatus.status);
    expect(finalStatus.isRunning).toBe(false);
  });
});
