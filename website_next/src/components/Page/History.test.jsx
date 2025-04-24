import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Historique from "./History.jsx";
import "@testing-library/jest-dom";

const mockScans = [
  {
    id: "1",
    url: "https://safe.com",
    scannedAt: new Date().toISOString(),
    status: "safe",
  },
  {
    id: "2",
    url: "https://warning.com",
    scannedAt: new Date().toISOString(),
    status: "warning",
  },
  {
    id: "3",
    url: "https://danger.com",
    scannedAt: new Date().toISOString(),
    status: "danger",
  },
];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ scans: mockScans, total: 3 }),
    blob: () => Promise.resolve(new Blob(["dummy PDF content"], { type: "application/pdf" })),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Historique", () => {
  it("affiche les scans après chargement", async () => {
    render(<Historique />);
    expect(screen.getByText(/Chargement des scans/i)).toBeInTheDocument();

    await waitFor(() => {
      mockScans.forEach((scan) => {
        expect(screen.getByText(scan.url)).toBeInTheDocument();
      });
    });
  });

  it("filtre les scans via la recherche", async () => {
    render(<Historique />);
    await waitFor(() => screen.getByText("https://safe.com"));

    const input = screen.getByPlaceholderText(/Rechercher un site/i);
    fireEvent.change(input, { target: { value: "danger" } });

    expect(screen.queryByText("https://safe.com")).not.toBeInTheDocument();
    expect(screen.getByText("https://danger.com")).toBeInTheDocument();
  });

  it("affiche le message 'Aucun scan trouvé' si recherche ne matche rien", async () => {
    render(<Historique />);
    await waitFor(() => screen.getByText("https://safe.com"));

    fireEvent.change(screen.getByPlaceholderText(/Rechercher/), {
      target: { value: "site-inexistant" },
    });

    expect(screen.getByText(/Aucun scan trouvé/i)).toBeInTheDocument();
  });

  it("gère le bouton 'Charger plus'", async () => {
    let calls = 0;
    global.fetch = jest.fn(() => {
      const data =
        calls === 0
          ? { scans: [mockScans[0]], total: 3 }
          : { scans: [mockScans[1], mockScans[2]], total: 3 };
      calls++;
      return Promise.resolve({ json: () => Promise.resolve(data) });
    });

    render(<Historique />);
    await waitFor(() => screen.getByText("https://safe.com"));

    const button = screen.getByRole("button", { name: /Charger plus/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("https://warning.com")).toBeInTheDocument();
      expect(screen.getByText("https://danger.com")).toBeInTheDocument();
    });
  });

  it("désactive le bouton 'Charger plus' pendant le chargement", async () => {
    let callCount = 0;
    global.fetch = jest.fn(() => {
      if (callCount === 0) {
        callCount++;
        return Promise.resolve({
          json: () => Promise.resolve({ scans: [mockScans[0]], total: 3 }),
        });
      } else {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ json: () => Promise.resolve({ scans: [mockScans[1]], total: 3 }) });
          }, 200);
        });
      }
    });

    render(<Historique />);
    await waitFor(() => screen.getByText("https://safe.com"));

    const button = screen.getByRole("button", { name: /Charger plus/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();
  });

  it("télécharge un rapport PDF", async () => {
    render(<Historique />);
    await waitFor(() => screen.getByText("https://safe.com"));

    const boutonPDF = screen.getAllByText(/Télécharger le rapport/i)[0];
    const createObjectURL = jest.fn(() => "blob:url");
    const revokeObjectURL = jest.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    const appendSpy = jest.spyOn(document.body, "appendChild");

    fireEvent.click(boutonPDF);

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalled();
      expect(appendSpy).toHaveBeenCalled();
    });
  });

  it("affiche les 3 statuts correctement", async () => {
    render(<Historique />);
    await waitFor(() => {
      expect(screen.getByText(/Aucune vulnérabilité détectée/)).toBeInTheDocument();
      expect(screen.getByText(/Quelques failles modérées/)).toBeInTheDocument();
      expect(screen.getByText(/Failles critiques détectées/)).toBeInTheDocument();
    });
  });

  it("gère les erreurs de fetch sans crash", async () => {
    global.fetch = jest.fn(() => Promise.reject("Erreur réseau"));
    render(<Historique />);
    await waitFor(() => {
      expect(screen.getByText(/Chargement des scans/i)).toBeInTheDocument();
    });
  });
});
