import React from "react";
import { render, screen } from "@testing-library/react";
import { useAppContext } from "./context/AppContext";

// 🧠 Déclare tous les mocks directement dans les factories
jest.mock("@/components/Page/AuthPage", () => {
  const MockAuthPage = () => <div>AuthPage</div>;
  MockAuthPage.displayName = "MockAuthPage";
  return {
    __esModule: true,
    default: MockAuthPage,
  };
});

jest.mock("@/components/Page/HomeUnlogged", () => {
  const MockHomeUnlogged = () => <div>HomeUnlogged</div>;
  MockHomeUnlogged.displayName = "MockHomeUnlogged";
  return {
    __esModule: true,
    default: MockHomeUnlogged,
  };
});

jest.mock("@/components/Contact", () => {
  const MockContact = () => <div>Contact</div>;
  MockContact.displayName = "MockContact";
  return {
    __esModule: true,
    default: MockContact,
  };
});

jest.mock("@/components/Page/Profile", () => {
  const MockProfile = () => <div>Profile</div>;
  MockProfile.displayName = "MockProfile";
  return {
    __esModule: true,
    default: MockProfile,
  };
});

jest.mock("@/components/Page/History", () => {
  const MockHistory = () => <div>History</div>;
  MockHistory.displayName = "MockHistory";
  return {
    __esModule: true,
    default: MockHistory,
  };
});

jest.mock("@/components/_ui/HelpModal/HelpModal", () => {
  const MockHelpModal = (props) => (
    <div>
      <h2>{props.title}</h2>
      <p>{props.text}</p>
      <img src={props.imageSrc} alt="aide" />
    </div>
  );
  MockHelpModal.displayName = "MockHelpModal";
  return {
    __esModule: true,
    default: MockHelpModal,
  };
});

// ✅ Mock AppContext après les mocks de composants
jest.mock("./context/AppContext");

// ✅ Importe ensuite ton composant à tester
import Index from "./page";

describe("Index page", () => {
  it("rend la page par défaut HomeUnlogged si aucune page active", () => {
    useAppContext.mockReturnValue({ activePage: "unknown", isAuthenticated: false });
    render(<Index />);
    expect(screen.getByText("HomeUnlogged")).toBeInTheDocument();
  });

  it("rend AuthPage si activePage est 'authentification'", () => {
    useAppContext.mockReturnValue({ activePage: "authentification", isAuthenticated: false });
    render(<Index />);
    expect(screen.getByText("AuthPage")).toBeInTheDocument();
    expect(screen.getByText("Connexion rapide")).toBeInTheDocument(); // titre de HelpModal
  });

  it("rend Contact uniquement si authentifié", () => {
    useAppContext.mockReturnValue({ activePage: "contact", isAuthenticated: true });
    render(<Index />);
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Besoin d’aide ?")).toBeInTheDocument();
  });

  it("ne rend pas Contact si non-authentifié", () => {
    useAppContext.mockReturnValue({ activePage: "contact", isAuthenticated: false });
    render(<Index />);
    expect(screen.queryByText("Contact")).not.toBeInTheDocument();
  });

  it("rend Profile uniquement si authentifié", () => {
    useAppContext.mockReturnValue({ activePage: "profile", isAuthenticated: true });
    render(<Index />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Votre profil")).toBeInTheDocument();
  });

  it("rend History uniquement si authentifié", () => {
    useAppContext.mockReturnValue({ activePage: "history", isAuthenticated: true });
    render(<Index />);
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Historique")).toBeInTheDocument();
  });
});
