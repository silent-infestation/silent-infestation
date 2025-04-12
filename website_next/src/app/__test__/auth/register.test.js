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
      create: jest.fn(),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "fake-token"),
}));

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

describe.only("POST /api/auth/register", () => {
  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renvoie une erreur si des champs sont manquants", async () => {
    const response = await POST(mockRequest({ email: "test@test.com", password: "123" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/tous les champs/i);
  });

  it("renvoie une erreur si l'âge n'est pas un nombre", async () => {
    const response = await POST(
      mockRequest({
        email: "test@test.com",
        password: "123",
        name: "John",
        surname: "Doe",
        age: "abc",
        society: "Acme",
      })
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/l'âge doit être un nombre/i);
  });

  it("renvoie une erreur si l'email est déjà utilisé", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "test@test.com" });

    const response = await POST(
      mockRequest({
        email: "test@test.com",
        password: "123",
        name: "John",
        surname: "Doe",
        age: "30",
        society: "Acme",
      })
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toMatch(/email déjà utilisé/i);
  });

  it("crée un nouvel utilisateur si les infos sont valides", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    hash.mockResolvedValue("hashed-password");

    const mockUser = {
      id: 1,
      email: "new@test.com",
      name: "Jane",
      surname: "Doe",
      age: 28,
      society: "Acme",
      role: "guest",
    };

    prisma.user.create.mockResolvedValue(mockUser);

    const response = await POST(
      mockRequest({
        email: "new@test.com",
        password: "123",
        name: "Jane",
        surname: "Doe",
        age: "28",
        society: "Acme",
      })
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Inscription réussie");
    expect(data.user).toEqual(mockUser);
  });
});
