import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "./Header";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../../app/context/AppContext", () => ({
  useAppContext: () => ({ changeActivePage: jest.fn() }),
}));

jest.mock("../../app/context/AuthProvider", () => ({
  useAuth: () => ({
    user: { token: "fake-token" },
    _loading: false,
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    global.fetch = jest.fn((url, options) => {
      if (url === "/api/sites") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                url: "https://pentest-ground.com:4280",
                state: "verified",
              },
            ]),
        });
      }

      if (url === "/api/scan/start") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { scanId: "1234" },
            }),
        });
      }

      if (url === "/api/scan/status") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { status: "success" },
            }),
        });
      }

      if (url === "/api/scan/terminate") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le titre principal", () => {
    render(<Header />);
    expect(screen.getByText(/Bienvenue sur/i)).toBeInTheDocument();
  });

  it("ouvre le popup de scan et affiche la sélection d'URL", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() =>
      expect(screen.getByText(/Sélectionnez une URL à scanner/i)).toBeInTheDocument()
    );
    expect(screen.getByText("https://pentest-ground.com:4280")).toBeInTheDocument();
  });

  it("ne lance pas le scan sans URL sélectionnée", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText(/Lancer le scan/i));

    // Assure que le fetch n'a pas été appelé pour lancer le scan
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/scan/start",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("lance le scan avec une URL sélectionnée", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText(/Lancer le scan/i));

    await waitFor(() =>
      expect(
        screen.getByText((text) => text.includes("Analyse de l’URL en cours"))
      ).toBeInTheDocument()
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/scan/start",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("annule un scan en cours", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText(/Lancer le scan/i));

    await waitFor(() =>
      expect(
        screen.getByText((text) => text.includes("Analyse de l’URL en cours"))
      ).toBeInTheDocument()
    );

    const cancelButton = screen.getByText(/Annuler le scan/i);
    fireEvent.click(cancelButton);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/scan/terminate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ scanId: "1234" }),
      })
    );
  });

  it("ferme le popup au clic sur Fermer", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText(/Sélectionnez une URL à scanner/i));
    fireEvent.click(screen.getByText(/Fermer/i));
    expect(screen.queryByText(/Sélectionnez une URL à scanner/i)).not.toBeInTheDocument();
  });
});
