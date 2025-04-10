// rc/app/api/auth/login/login.test.js

// Ajoutez ce code avant tout import qui pourrait utiliser Request
import { Request } from "node-fetch";
global.Request = Request;

import { POST } from "./route"; // Adaptez le chemin si nécessaire
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

// On se moque de PrismaClient pour tester isolément
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
      },
    })),
  };
});

// On se moque de bcryptjs et de jsonwebtoken
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "test-token"),
}));

// Helper pour créer une "fake" requête qui possède une méthode json()
const mockRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retourne 400 si email et mot de passe ne sont pas fournis", async () => {
    const request = mockRequest({ email: "", password: "" });
    const response = await POST(request);
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.message).toBe("Email et mot de passe sont requis");
  });

  it("retourne 400 si l'utilisateur n'est pas trouvé", async () => {
    const request = mockRequest({ email: "test@example.com", password: "password" });
    // On force la réponse de la recherche en base à null
    PrismaClient.prototype.user.findUnique.mockResolvedValue(null);
    const response = await POST(request);
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.message).toBe("Email ou mot de passe incorrect");
  });

  it("retourne 400 si le mot de passe ne correspond pas", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      password: "hashedpassword",
      role: "user",
      name: "Test",
      surname: "User",
      age: 30,
      society: "Test Society",
    };
    const request = mockRequest({ email: "test@example.com", password: "wrongpassword" });
    PrismaClient.prototype.user.findUnique.mockResolvedValue(mockUser);
    // On force le compare pour qu'il retourne false
    compare.mockResolvedValue(false);
    const response = await POST(request);
    expect(response.status).toBe(400);
    const jsonResponse = await response.json();
    expect(jsonResponse.message).toBe("Email ou mot de passe incorrect");
  });

  it("retourne 200 et définit le cookie en cas de connexion réussie", async () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      password: "hashedpassword",
      role: "user",
      name: "Test",
      surname: "User",
      age: 30,
      society: "Test Society",
    };
    const request = mockRequest({ email: "test@example.com", password: "correctpassword" });
    PrismaClient.prototype.user.findUnique.mockResolvedValue(mockUser);
    // On force le compare pour qu'il retourne true
    compare.mockResolvedValue(true);
    const response = await POST(request);
    expect(response.status).toBe(200);
    const jsonResponse = await response.json();
    expect(jsonResponse.message).toBe("Connexion réussie");
    // Vérifie que le header "Set-Cookie" contient le token
    expect(response.headers.get("Set-Cookie")).toContain("token=test-token");
  });
});
