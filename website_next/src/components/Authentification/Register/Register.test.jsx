import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Register from ".";

// Mock de fetch
global.fetch = jest.fn();

jest.mock("@/app/context/AppContext", () => ({
  useAppContext: () => ({
    login: jest.fn(),
    isAuthenticated: false,
    activePage: "home",
    changeActivePage: jest.fn(),
    logout: jest.fn(),
    loading: false,
  }),
}));

describe("Register Component", () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders registration form with all required fields", () => {
    render(<Register />);

    expect(screen.getByPlaceholderText("Nom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Prénom")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Âge")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Société")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mot de passe")).toBeInTheDocument();
    expect(screen.getByText("S'inscrire")).toBeInTheDocument();
  });

  it("handles successful registration", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Inscription réussie" }),
      })
    );

    render(<Register />);

    const fields = {
      name: screen.getByPlaceholderText("Nom"),
      surname: screen.getByPlaceholderText("Prénom"),
      age: screen.getByPlaceholderText("Âge"),
      society: screen.getByPlaceholderText("Société"),
      email: screen.getByPlaceholderText("Email"),
      password: screen.getByPlaceholderText("Mot de passe"),
    };

    await act(async () => {
      await userEvent.type(fields.name, "John");
      await userEvent.type(fields.surname, "Doe");
      await userEvent.type(fields.age, "25");
      await userEvent.type(fields.society, "Tech Corp");
      await userEvent.type(fields.email, "john@example.com");
      await userEvent.type(fields.password, "password123");
      fireEvent.click(screen.getByText("S'inscrire"));
    });
  });

  it("handles registration error from API", async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "Une erreur est survenue." }),
      })
    );

    render(<Register />);

    // Remplir tous les champs
    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText("Nom"), "John");
      await userEvent.type(screen.getByPlaceholderText("Prénom"), "Doe");
      await userEvent.type(screen.getByPlaceholderText("Âge"), "25");
      await userEvent.type(screen.getByPlaceholderText("Société"), "Tech Corp");
      await userEvent.type(screen.getByPlaceholderText("Email"), "john@example.com");
      await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "password123");

      fireEvent.click(screen.getByText("S'inscrire"));
    });

    // Vérification du message d'erreur
    await waitFor(() => {
      expect(screen.getByText("Une erreur est survenue.")).toBeInTheDocument();
    });
  });

  it("handles network error during registration", async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error("Network error")));

    render(<Register />);

    await act(async () => {
      await userEvent.type(screen.getByPlaceholderText("Nom"), "John");
      await userEvent.type(screen.getByPlaceholderText("Prénom"), "Doe");
      await userEvent.type(screen.getByPlaceholderText("Âge"), "25");
      await userEvent.type(screen.getByPlaceholderText("Société"), "Tech Corp");
      await userEvent.type(screen.getByPlaceholderText("Email"), "john@example.com");
      await userEvent.type(screen.getByPlaceholderText("Mot de passe"), "password123");

      fireEvent.click(screen.getByText("S'inscrire"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("S'inscrire"));
    });

    await waitFor(() => {
      expect(screen.getByText("Impossible de contacter le serveur.")).toBeInTheDocument();
    });
  });

  it("validates required fields before submission", async () => {
    render(<Register />);

    await act(async () => {
      fireEvent.click(screen.getByText("S'inscrire"));
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
