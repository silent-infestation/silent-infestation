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

const userId = 999;

const mockRequest = (cookie) => ({
  headers: {
    get: () => cookie,
  },
});

beforeEach(() => {
  jest.resetModules();
  global.scanStatusMap = new Map();
  jest.clearAllMocks();
});

describe("POST /api/scan/start", () => {
  it("renvoie une erreur si un scan est déjà en cours", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });
    global.scanStatusMap.set(userId, { isRunning: true, status: "running" });

    const { POST } = await import("@/app/api/scan/start/route");

    const response = await POST(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Scan déjà en cours pour cet utilisateur.");
  });

  it("lance un scan si aucun scan n’est en cours", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    const { POST } = await import("@/app/api/scan/start/route");

    const response = await POST(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Scan lancé pour l'utilisateur.");

    const status = global.scanStatusMap.get(userId);
    expect(status).toEqual({ isRunning: true, status: "running" });

    await new Promise((r) => setTimeout(r, 10));
    const final = global.scanStatusMap.get(userId);
    expect(final.isRunning).toBe(false);
    expect(["success", "error"]).toContain(final.status);
  });
});
