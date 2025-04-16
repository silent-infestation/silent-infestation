import { jest } from "@jest/globals";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => {
      return {
        status: init.status || 200,
        headers: init.headers || {},
        json: async () => data,
      };
    }),
  },
}));

jest.mock("@/scripts/audit/index.js", () => ({
  runAudit: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@prisma/client", () => {
  const scan = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => ({
      scan,
    })),
  };
});

const { verify } = require("jsonwebtoken");
const { runAudit } = require("@/scripts/audit/index");
const { PrismaClient } = require("@prisma/client");
const scanMock = PrismaClient().scan;

const userId = 42;

const mockRequest = (cookie, jsonBody = { startUrl: "http://example.com" }) => ({
  headers: {
    get: () => cookie,
  },
  json: jest.fn().mockResolvedValue(jsonBody),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/scan/start", () => {
  it("returns 401 if JWT token is missing", async () => {
    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest(""));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/missing jwt/i);
  });

  it("returns 401 if JWT token is invalid", async () => {
    verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=bad.token"));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toMatch(/invalid/i);
  });

  it("returns 400 if startUrl is invalid", async () => {
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token", { startUrl: "ftp://example.com" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/invalid start/i);
  });

  it("returns 400 if scan is already running", async () => {
    verify.mockReturnValue({ id: userId });
    scanMock.findFirst.mockResolvedValue({ id: 1, isRunning: true });

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toMatch(/already running/i);
  });

  it("starts a new scan and returns 200", async () => {
    verify.mockReturnValue({ id: userId });
    scanMock.findFirst.mockResolvedValue(null);

    scanMock.create.mockResolvedValue({ id: 123, userId, url: "http://example.com" });
    scanMock.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/scan/start/route");
    const res = await POST(mockRequest("token=valid.token"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toMatch(/scan started/i);

    await new Promise((r) => setTimeout(r, 10));

    expect(runAudit).toHaveBeenCalledWith("http://example.com", userId);
  });
});
