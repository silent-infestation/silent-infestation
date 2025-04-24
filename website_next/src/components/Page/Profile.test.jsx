// ✅ Profile.test.jsx final — version 100 % fiable
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "./Profile";
import { useAuth } from "@/app/context/AuthProvider";
import { useAppContext } from "@/app/context/AppContext";

jest.mock("@/app/context/AuthProvider");
jest.mock("@/app/context/AppContext");

describe("Profile component", () => {
  const mockUser = {
    id: "user123",
    name: "Jean",
    surname: "Dupont",
    email: "jean.dupont@example.com",
    token: "fake-jwt-token",
  };

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      refreshUser: jest.fn(),
    });

    useAppContext.mockReturnValue({
      logout: jest.fn(),
    });

    global.fetch = jest.fn((url, options) => {
      if (url === "/api/sites" && (!options || options.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (url === "/api/sites" && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "site123",
              url: "https://test.com",
              state: "verified",
            }),
        });
      }
      if (url.startsWith("/api/sites/") && options?.method === "DELETE") {
        return Promise.resolve({ ok: true });
      }
      if (url === "/api/mailer") {
        return Promise.resolve({ ok: true });
      }
      if (url === "/user/me" && options?.method === "PUT") {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("ajoute une URL valide", async () => {
    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Ajouter une URL fiable/i), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByText("Ajouter"));

    await waitFor(() => {
      const nodes = screen.queryAllByText((_, node) =>
        node?.textContent?.includes("https://test.com")
      );
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  it("supprime une URL", async () => {
    render(<Profile />);
    fireEvent.change(screen.getByPlaceholderText(/Ajouter une URL fiable/i), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByText("Ajouter"));

    await waitFor(() => {
      const nodes = screen.queryAllByText((_, node) =>
        node?.textContent?.includes("https://test.com")
      );
      expect(nodes.length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByText("Supprimer"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/sites/site123",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
