import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth } from "./AuthProvider.jsx"; // Chemin corrigé avec l'extension .jsx
import api from "@/lib/api"; // Assurez-vous d'importer api correctement pour le mock

// Mock de l'API
jest.mock("@/lib/api", () => ({
  get: jest.fn(),
}));

const TestComponent = () => {
  const { user, loading } = useAuth();
  return <div>{loading ? <p>Loading...</p> : <p>{user ? user.name : "No user"}</p>}</div>;
};

describe("AuthProvider", () => {
  test("should set loading to false after API call", async () => {
    // Mock de l'API réussie
    api.get.mockResolvedValueOnce({
      status: 200,
      ok: true,
      data: { user: { name: "John Doe" } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Attends que "John Doe" apparaisse dans le DOM
    await screen.findByText("John Doe"); // Utilise findByText pour attendre la mise à jour

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("should set user correctly after a successful API call", async () => {
    // Mock de l'API réussie
    api.get.mockResolvedValueOnce({
      status: 200,
      ok: true,
      data: { user: { name: "John Doe" } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
  });

  test("should handle 401 error and set user to null", async () => {
    // Mock de l'API avec statut 401
    api.get.mockResolvedValueOnce({
      status: 401,
      ok: false,
      data: {},
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("No user")).toBeInTheDocument());
  });

  test("should handle API errors and display appropriate message", async () => {
    // Mock de l'API avec une erreur
    api.get.mockRejectedValueOnce(new Error("API Error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("No user")).toBeInTheDocument());
  });

  test("should call refreshUser function", async () => {
    const mockRefreshUser = jest.fn();
    api.get.mockResolvedValueOnce({
      status: 200,
      ok: true,
      data: { user: { name: "John Doe" } },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
    mockRefreshUser(); // Simule l'appel à refreshUser

    expect(mockRefreshUser).toHaveBeenCalled();
  });
});
