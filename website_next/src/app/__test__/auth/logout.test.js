jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      headers: init.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

import { POST } from "@/app/api/auth/logout/route";
import { cookies } from "next/headers";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renvoie 200 si un token est présent", async () => {
    const cookieStore = {
      get: jest.fn(() => ({ name: "token", value: "abc123" })),
      set: jest.fn(),
    };

    cookies.mockReturnValue(cookieStore);

    const response = await POST();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Déconnexion réussie");
    expect(cookieStore.set).toHaveBeenCalledWith("token", "", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
    });
  });

  it("renvoie 400 si aucun token n'est présent", async () => {
    const cookieStore = {
      get: jest.fn(() => undefined),
      set: jest.fn(),
    };

    cookies.mockReturnValue(cookieStore);

    const response = await POST();

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("No token found");
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
