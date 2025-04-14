jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

import { GET, PUT, DELETE } from "@/app/api/user/me/route";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

describe.only("User /me API", () => {
  const user = {
    id: 1,
    email: "test@example.com",
    name: "John",
    surname: "Doe",
    role: "user",
    age: 30,
    society: "TestCorp",
  };

  const mockRequest = (body = null, cookie = "token=validtoken") => ({
    headers: {
      get: () => cookie,
    },
    json: () => Promise.resolve(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/user/me", () => {
    it("should return user data if token is valid", async () => {
      verify.mockReturnValue({ id: user.id });
      prisma.user.findUnique.mockResolvedValue(user);

      const response = await GET(mockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(user);
    });

    it("should return 401 if token is missing", async () => {
      const response = await GET(mockRequest(null, ""));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("No token provided");
    });

    it("should return 404 if user is not found", async () => {
      verify.mockReturnValue({ id: user.id });
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await GET(mockRequest());
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User not found");
    });
  });

  describe("PUT /api/user/me", () => {
    it("should update and return user data", async () => {
      const updatedUser = { ...user, name: "Jane" };
      verify.mockReturnValue({ id: user.id });
      prisma.user.update.mockResolvedValue(updatedUser);

      const request = mockRequest({ name: "Jane", surname: "Doe", email: "test@example.com" });
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(updatedUser);
    });
  });

  describe("DELETE /api/user/me", () => {
    it("should delete user and return success", async () => {
      verify.mockReturnValue({ id: user.id });
      prisma.user.delete.mockResolvedValue({});

      const response = await DELETE(mockRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("User deleted successfully");
    });
  });
});
