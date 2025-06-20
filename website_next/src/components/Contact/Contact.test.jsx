import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Contact from ".";

// Mock global fetch
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("Contact Component", () => {
  it("affiche tous les champs du formulaire", () => {
    render(<Contact />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sujet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Envoyer le message/i })).toBeInTheDocument();
  });

  it("envoie le formulaire avec succès et affiche un message de confirmation", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Sujet/i), {
      target: { value: "Sujet test" },
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "Ceci est un message de test." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Envoyer le message/i }));

    await waitFor(() =>
      expect(screen.getByText(/Message envoyé avec succès/i)).toBeInTheDocument()
    );
  });

  it("gère une erreur d'envoi et affiche un message d'erreur", async () => {
    fetch.mockRejectedValueOnce(new Error("Erreur réseau"));

    render(<Contact />);

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Sujet/i), {
      target: { value: "Erreur test" },
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: "Message qui ne passe pas." },
    });

    fireEvent.click(screen.getByRole("button", { name: /Envoyer le message/i }));

    await waitFor(() =>
      expect(screen.getByText(/Erreur lors de l'envoi du message/i)).toBeInTheDocument()
    );
  });

  it("réinitialise le formulaire après envoi", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<Contact />);

    const emailInput = screen.getByLabelText(/Email/i);
    const subjectInput = screen.getByLabelText(/Sujet/i);
    const messageInput = screen.getByLabelText(/Message/i);

    fireEvent.change(emailInput, { target: { value: "reset@test.com" } });
    fireEvent.change(subjectInput, { target: { value: "Sujet" } });
    fireEvent.change(messageInput, { target: { value: "Contenu" } });

    fireEvent.click(screen.getByRole("button", { name: /Envoyer le message/i }));

    await waitFor(() => {
      expect(emailInput.value).toBe("");
      expect(subjectInput.value).toBe("");
      expect(messageInput.value).toBe("");
    });
  });
});
