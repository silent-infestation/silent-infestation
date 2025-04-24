import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppProvider, useAppContext } from "./AppContext";

// Composant de test qui est toujours rendu
const TestComponent = () => {
  const { login, logout, loading } = useAppContext();

  return (
    <div>
      {!loading && (
        <>
          <button onClick={login}>Login</button>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
};

// Mock complet de sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

beforeEach(() => {
  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage,
    writable: true,
  });

  mockSessionStorage.getItem.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockSessionStorage.removeItem.mockClear();

  global.fetch = jest.fn();
});

describe("AppContext", () => {
  test("should check if user is authenticated and set activePage", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true }),
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() =>
      expect(sessionStorage.setItem).toHaveBeenCalledWith("activePage", "profile")
    );
  });

  test("should handle logout action and set activePage to home", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => screen.getByText("Logout")); // assure que les boutons sont montés
    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => expect(sessionStorage.setItem).toHaveBeenCalledWith("activePage", "home"));
  });

  test("should handle login action and set activePage to profile", async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => screen.getByText("Login"));
    fireEvent.click(screen.getByText("Login"));

    await waitFor(() =>
      expect(sessionStorage.setItem).toHaveBeenCalledWith("activePage", "profile")
    );
  });

  test("should handle API error correctly and set activePage to home", async () => {
    global.fetch.mockRejectedValueOnce(new Error("API error"));

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => expect(sessionStorage.setItem).toHaveBeenCalledWith("activePage", "home"));
  });
});
