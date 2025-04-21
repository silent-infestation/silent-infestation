/**
 * @jest-environment node
 */

import { GET, PUT, DELETE } from "@/app/api/user/me/route";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

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

jest.mock("cookie", () => ({
  parse: jest.fn(),
}));

describe("API /user/me", () => {
  const mockUser = {
    id: "user123",
    email: "test@example.com",
    name: "John",
    surname: "Doe",
    role: "user",
    age: 30,
    society: "MyCorp",
  };

  const createRequest = (method = "GET", body = {}, cookies = "token=valid.jwt") => {
    const headers = { get: (key) => (key === "cookie" ? cookies : null) };
    return {
      method,
      headers,
      json: () => Promise.resolve(body),
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // GET
  describe("GET", () => {
    it("should return user data with valid token", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await GET(createRequest("GET"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: mockUser });
    });

    it("should return 401 if no token", async () => {
      parse.mockReturnValue({});
      const res = await GET(createRequest("GET", {}, ""));
      expect(res.status).toBe(401);
    });

    it("should return 404 if user not found", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await GET(createRequest("GET"));
      expect(res.status).toBe(404);
    });

    it("should return 401 if token is invalid", async () => {
      parse.mockReturnValue({ token: "invalid.jwt" });
      jwt.verify.mockImplementation(() => {
        throw new Error("Invalid");
      });

      const res = await GET(createRequest("GET"));
      expect(res.status).toBe(401);
    });
  });

  // PUT
  describe("PUT", () => {
    it("should update user data", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });

      const updatedUser = { ...mockUser, name: "Jane" };
      prisma.user.update.mockResolvedValue(updatedUser);

      const req = createRequest("PUT", {
        name: "Jane",
        surname: "Doe",
        email: "jane@example.com",
      });

      const res = await PUT(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ user: updatedUser });
    });

    it("should return 401 if no token on PUT", async () => {
      parse.mockReturnValue({});
      const res = await PUT(createRequest("PUT", {}, ""));
      expect(res.status).toBe(401);
    });

    it("should return 401 if token payload invalid on PUT", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({});
      const res = await PUT(createRequest("PUT"));
      expect(res.status).toBe(401);
    });

    it("should return 401 if update throws", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });
      prisma.user.update.mockRejectedValue(new Error("fail"));

      const res = await PUT(createRequest("PUT"));
      expect(res.status).toBe(401);
    });
  });

  // DELETE
  describe("DELETE", () => {
    it("should delete user", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });

      prisma.user.delete.mockResolvedValue({});

      const res = await DELETE(createRequest("DELETE"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ message: "User deleted successfully" });
    });

    it("should return 401 if no token on DELETE", async () => {
      parse.mockReturnValue({});
      const res = await DELETE(createRequest("DELETE", {}, ""));
      expect(res.status).toBe(401);
    });

    it("should return 401 if token payload invalid on DELETE", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({});
      const res = await DELETE(createRequest("DELETE"));
      expect(res.status).toBe(401);
    });

    it("should return 401 if delete throws", async () => {
      parse.mockReturnValue({ token: "valid.jwt" });
      jwt.verify.mockReturnValue({ id: "user123" });
      prisma.user.delete.mockRejectedValue(new Error("fail"));

      const res = await DELETE(createRequest("DELETE"));
      expect(res.status).toBe(401);
    });
  });
});
