import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth } from "./AuthProvider.jsx"; // Assure-toi que ce chemin est correct

// Mock de fetch
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

const TestComponent = () => {
  const { user, loading } = useAuth();
  return <div>{loading ? <p>Loading...</p> : <p>{user ? user.name : "No user"}</p>}</div>;
};

describe("AuthProvider", () => {
  test("should set loading to false after API call", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: { name: "John Doe" } }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await screen.findByText("John Doe");

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  test("should set user correctly after a successful API call", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ user: { name: "John Doe" } }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("John Doe")).toBeInTheDocument());
  });

  test("should handle 401 error and set user to null", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("No user")).toBeInTheDocument());
  });

  test("should handle API errors and display appropriate message", async () => {
    global.fetch.mockRejectedValueOnce(new Error("API Error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("No user")).toBeInTheDocument());
  });
});
