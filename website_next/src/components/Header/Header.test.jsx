import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "./Header";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock("../../app/context/AppContext", () => ({
  useAppContext: jest.fn(),
}));

jest.mock("../../app/context/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import api from "@/lib/api";
import { useAppContext } from "../../app/context/AppContext";
import { useAuth } from "../../app/context/AuthProvider";

describe("Header", () => {
  const mockChangeActivePage = jest.fn();

  beforeEach(() => {
    useAppContext.mockReturnValue({ changeActivePage: mockChangeActivePage });
    useAuth.mockReturnValue({
      user: { token: "fake-token" },
      _loading: false,
    });

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([{ id: 1, url: "https://pentest-ground.com:4280", state: "verified" }]),
      })
    );
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

  // it("change la couleur du bouton sélectionné", async () => {
  //   render(<Header />);
  //   fireEvent.click(screen.getByText(/Scanner un site/i));

  //   await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));

  //   const urlButton = screen.getByText("https://pentest-ground.com:4280");
  //   fireEvent.click(urlButton);

  //   expect(urlButton).toHaveClass("bg-[#05829E]");
  // });

  it("ne lance pas le scan sans URL sélectionnée", async () => {
    api.post.mockResolvedValue({});
    render(<Header />);

    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));

    fireEvent.click(screen.getByText(/Lancer le scan/i));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("lance le scan avec une URL sélectionnée", async () => {
    api.post.mockResolvedValue({ data: { scanId: "1234" } });
    api.get.mockResolvedValue({ data: { status: "success" } });

    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText(/Lancer le scan/i));

    await waitFor(() => screen.getByText(/Analyse de l’URL en cours/i));
    expect(api.post).toHaveBeenCalledWith("/scan/start", expect.anything());
  });

  it("annule un scan en cours", async () => {
    api.post.mockResolvedValueOnce({ data: { scanId: "1234" } });
    api.get.mockResolvedValue({ data: { status: "in_progress" } });
    api.post.mockResolvedValueOnce({});

    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText("https://pentest-ground.com:4280"));
    fireEvent.click(screen.getByText(/Lancer le scan/i));

    await waitFor(() => screen.getByText(/Analyse de l’URL en cours/i));
    const cancelButton = screen.getByText(/Annuler le scan/i);
    fireEvent.click(cancelButton);

    expect(api.post).toHaveBeenCalledWith("/scan/terminate", { scanId: "1234" });
  });

  // it("redirige vers le profil s'il n'y a pas d'URL fiable", async () => {
  //   global.fetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });
  //   render(<Header />);
  //   fireEvent.click(screen.getByText(/Scanner un site/i));
  //   await waitFor(() => screen.getByText(/Vous n’avez pas encore d’URL fiable/));
  //   fireEvent.click(screen.getByText(/Ajouter une URL dans mon profil/i));
  //   expect(mockChangeActivePage).toHaveBeenCalledWith("profile");
  // });

  it("ferme le popup au clic sur Fermer", async () => {
    render(<Header />);
    fireEvent.click(screen.getByText(/Scanner un site/i));
    await waitFor(() => screen.getByText(/Sélectionnez une URL à scanner/i));
    fireEvent.click(screen.getByText(/Fermer/i));
    expect(screen.queryByText(/Sélectionnez une URL à scanner/i)).not.toBeInTheDocument();
  });
});
