import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AppProvider, useAppContext } from "./AppContext";

// Mock global fetch
global.fetch = jest.fn();

// Mock sessionStorage
beforeEach(() => {
  global.sessionStorage.setItem = jest.fn();
  global.sessionStorage.getItem = jest.fn();
  global.sessionStorage.removeItem = jest.fn();
});

// Composant de test pour simuler login et logout
const TestComponent = () => {
  const { login, logout } = useAppContext();
  return (
    <>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
    </>
  );
};

// Test d'authentification
test("should check if user is authenticated and set activePage", async () => {
  // Simuler une réponse de l'API pour un utilisateur authentifié
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ authenticated: true }),
  });

  render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );

  await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());

  // Vérifie que la page active est définie sur 'profile'
  expect(sessionStorage.getItem("activePage")).toBe("profile");
});

// Test de déconnexion
test("should handle logout action and set activePage to home", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ authenticated: false }),
  });

  render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );

  await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());

  // Simuler la déconnexion
  const logoutButton = screen.getByText("Logout");
  fireEvent.click(logoutButton);

  await waitFor(() => {
    expect(sessionStorage.getItem("activePage")).toBe("home");
  });
});

// Test de connexion
test("should handle login action and set activePage to profile", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ authenticated: true }),
  });

  render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );

  await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());

  // Simuler la connexion
  const loginButton = screen.getByText("Login");
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(sessionStorage.getItem("activePage")).toBe("profile");
  });
});

// Test d'erreur API
test("should handle API error correctly and set activePage to home", async () => {
  // Simuler une erreur de l'API
  fetch.mockRejectedValueOnce(new Error("API Error"));

  render(
    <AppProvider>
      <TestComponent />
    </AppProvider>
  );

  await waitFor(() => {
    expect(sessionStorage.getItem("activePage")).toBe("home");
  });
});
