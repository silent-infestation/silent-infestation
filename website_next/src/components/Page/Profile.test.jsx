import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Profile from "./Profile";
import { useAuth } from "@/app/context/AuthProvider";
import { useAppContext } from "@/app/context/AppContext";
import api from "@/lib/api";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve([
        {
          id: "site123",
          url: "https://test.com",
          state: "verified",
        },
      ]),
  })
);

jest.mock("@/app/context/AuthProvider");
jest.mock("@/app/context/AppContext");
jest.mock("@/lib/api");

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

    api.post.mockResolvedValue({
      status: 200,
      data: {
        verified: true,
        id: "site123",
        url: "https://test.com",
        state: "verified",
      },
      ok: true,
      message: "Opération réussie",
    });

    api.put.mockResolvedValue({ status: 200 });
    api.del.mockResolvedValue({ status: 200 });
  });

  it("affiche le profil de l'utilisateur", () => {
    render(<Profile />);
    expect(screen.getByDisplayValue("Jean")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dupont")).toBeInTheDocument();
    expect(screen.getByDisplayValue("jean.dupont@example.com")).toBeInTheDocument();
  });

  it("permet de modifier et sauvegarder le profil", async () => {
    render(<Profile />);
    fireEvent.click(screen.getByText("Modifier"));

    const inputPrenom = screen.getByDisplayValue("Jean");
    fireEvent.change(inputPrenom, { target: { value: "NouveauNom" } });

    fireEvent.click(screen.getByText("Enregistrer"));
    expect(api.put).toHaveBeenCalled();
  });

  it("ajoute une URL valide", async () => {
    render(<Profile />);
    const input = screen.getByPlaceholderText(/Ajouter une URL fiable/i);
    fireEvent.change(input, { target: { value: "https://test.com" } });
    fireEvent.click(screen.getByText("Ajouter"));

    const url = await screen.findByText("https://test.com");
    expect(url).toBeInTheDocument();
  });

  it("supprime une URL", async () => {
    render(<Profile />);
    const input = screen.getByPlaceholderText(/Ajouter une URL fiable/i);
    fireEvent.change(input, { target: { value: "https://test.com" } });
    fireEvent.click(screen.getByText("Ajouter"));

    const url = await screen.findByText("https://test.com");
    expect(url).toBeInTheDocument();

    fireEvent.click(screen.getByText("Supprimer"));
    expect(api.del).toHaveBeenCalled();
  });

  it("affiche un message de chargement si loading est true", () => {
    useAuth.mockReturnValueOnce({ user: null, loading: true });
    render(<Profile />);
    expect(screen.getByText(/Chargement du profil/i)).toBeInTheDocument();
  });

  it("affiche un message si l'utilisateur n'est pas connecté", () => {
    useAuth.mockReturnValueOnce({ user: null, loading: false });
    render(<Profile />);
    expect(screen.getByText(/Utilisateur non connecté/i)).toBeInTheDocument();
  });
});
