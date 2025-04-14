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

global.scanStatusMap = new Map();

const { POST } = require("@/app/api/scan/start/route");
const { verify } = require("jsonwebtoken");

describe("POST /api/scan/start", () => {
  const mockRequest = (cookie) => ({
    headers: {
      get: () => cookie,
    },
  });

  beforeEach(() => {
    global.scanStatusMap.clear();
    jest.clearAllMocks();
  });

  it("renvoie une erreur si un scan est déjà en cours", async () => {
    verify.mockReturnValue({ id: userId });
    global.scanStatusMap.set(userId, { isRunning: true, status: "running" });

    const response = await POST(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.message).toBe("Scan déjà en cours pour cet utilisateur.");
  });

  it("lance un scan si aucun scan n’est en cours", async () => {
    verify.mockReturnValue({ id: userId });

    const response = await POST(mockRequest("token=valid.token"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Scan lancé pour l'utilisateur.");

    const status = global.scanStatusMap.get(userId);
    expect(status).toEqual({ isRunning: true, status: "running" });

    await new Promise((res) => setTimeout(res, 10));

    const finalStatus = global.scanStatusMap.get(userId);
    expect(finalStatus.isRunning).toBe(false);
    expect(["success", "error"]).toContain(finalStatus.status);
  });
});
