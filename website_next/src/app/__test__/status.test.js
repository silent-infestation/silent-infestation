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

describe.only("GET /api/scan/status", () => {
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

  it("renvoie une erreur 401 si le token est manquant", async () => {
    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest(""));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Token manquant");
  });

  it("renvoie une erreur 401 si le token est invalide", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=invalid.token"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Token invalide ou expiré");
  });

  it("renvoie le statut not_started si aucun statut n’est présent", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isRunning: false,
      status: "not_started",
      result: null,
    });
  });

  it("renvoie le statut réel si présent", async () => {
    const { verify } = require("jsonwebtoken");
    verify.mockReturnValue({ id: userId });

    global.scanStatusMap.set(userId, {
      isRunning: true,
      status: "running",
      result: { audit: "en cours" },
    });

    const { GET } = await import("@/app/api/scan/status/route");

    const response = await GET(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      isRunning: true,
      status: "running",
      result: { audit: "en cours" },
    });
  });
});
