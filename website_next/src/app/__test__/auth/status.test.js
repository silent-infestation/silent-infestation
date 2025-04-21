jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init?.status || 200,
      headers: init?.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

import { GET } from "@/app/api/auth/status/route";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

describe("GET /api/auth/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renvoie false si aucun token n'est présent", async () => {
    cookies.mockReturnValue({
      get: jest.fn(() => undefined),
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.authenticated).toBe(false);
  });

  it("renvoie false si le token est invalide (jwt.verify throw)", async () => {
    cookies.mockReturnValue({
      get: jest.fn(() => ({ name: "token", value: "invalid" })),
    });

    jwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.authenticated).toBe(false);
  });

  it("renvoie true si le token est valide", async () => {
    cookies.mockReturnValue({
      get: jest.fn(() => ({ name: "token", value: "valid-token" })),
    });

    jwt.verify.mockReturnValue({ id: 1, email: "test@test.com", role: "user" });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.authenticated).toBe(true);
  });
});
