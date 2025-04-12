jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      headers: init.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "fake-token"),
}));

import { POST } from "@/app/api/auth/login/route";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

describe("POST /api/login", () => {
  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renvoie une erreur si email ou password est manquant", async () => {
    const response = await POST(mockRequest({ email: "", password: "" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Email et mot de passe sont requis");
  });

  it("renvoie une erreur si le mot de passe est incorrect", async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: "test@test.com",
      password: "hashed", // doit exister
      id: 1,
      role: "user", // même si inutilisé ici
    });

    compare.mockResolvedValue(false); // simule mauvais mot de passe

    const response = await POST(mockRequest({ email: "test@test.com", password: "wrong" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Email ou mot de passe incorrect");
  });

  it("renvoie une erreur si le mot de passe est incorrect", async () => {
    prisma.user.findUnique.mockResolvedValue({ email: "test@test.com", password: "hashed" });
    compare.mockResolvedValue(false);

    const response = await POST(mockRequest({ email: "test@test.com", password: "wrong" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Email ou mot de passe incorrect");
  });

  it("renvoie un token si l'utilisateur est valide", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "hashed",
      role: "admin",
    });

    compare.mockResolvedValue(true);

    const response = await POST(mockRequest({ email: "test@test.com", password: "correct" }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Connexion réussie");
  });
});
