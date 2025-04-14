// src/app/__test__/user/userById.test.js

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

import { prisma } from "@/lib/prisma";
import { handleGetUser, handleUpdateUser, handleDeleteUser } from "@/app/api/user/[id]/core";

describe("User API by ID", () => {
  const mockParams = { id: "1" };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET - should return user without password", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: "hashed",
      name: "John",
    });

    const response = await handleGetUser(mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 1,
      email: "test@test.com",
      name: "John",
    });
  });

  it("GET - should return 404 if user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const response = await handleGetUser(mockParams);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.message).toBe("User not found");
  });

  it("PUT - should update and return user without password", async () => {
    const mockRequest = {
      json: () =>
        Promise.resolve({
          email: "updated@test.com",
          name: "Jane",
          surname: "Doe",
          age: 30,
          society: "MySociety",
          scanID: 123,
        }),
    };

    prisma.user.update.mockResolvedValue({
      id: 1,
      email: "updated@test.com",
      name: "Jane",
      surname: "Doe",
      age: 30,
      society: "MySociety",
      scanID: 123,
      password: "hidden",
    });

    const response = await handleUpdateUser(mockRequest, mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.password).toBeUndefined();
    expect(data.email).toBe("updated@test.com");
  });

  it("DELETE - should delete user and return confirmation", async () => {
    prisma.user.delete.mockResolvedValue({});

    const response = await handleDeleteUser(mockParams);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("User deleted");
  });
});
