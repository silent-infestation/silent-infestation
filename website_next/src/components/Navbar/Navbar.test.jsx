import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Navbar from ".";
import { useAppContext } from "@/app/context/AppContext";

// Mock du contexte
jest.mock("@/app/context/AppContext", () => ({
  useAppContext: jest.fn(),
}));

// Mock des composants Next.js
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}));

// Mock des icônes react-icons
jest.mock("react-icons/fi", () => ({
  FiMenu: () => <div data-testid="menu-icon">Menu Icon</div>,
  FiX: () => <div data-testid="close-icon">Close Icon</div>,
}));

describe("Navbar Component", () => {
  let mockChangeActivePage;
  let mockLogout;

  beforeEach(() => {
    mockChangeActivePage = jest.fn();
    mockLogout = jest.fn();
    useAppContext.mockReturnValue({
      isAuthenticated: false,
      changeActivePage: jest.fn(),
      logout: jest.fn(),
      activePage: "home",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders logo and initial navigation state", () => {
    render(<Navbar />);

    expect(screen.getByAltText("Logo")).toBeInTheDocument();
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("handles authentication state correctly", async () => {
    useAppContext.mockReturnValue({
      isAuthenticated: true,
      changeActivePage: mockChangeActivePage,
      logout: mockLogout,
      activePage: "home",
    });

    render(<Navbar />);

    expect(screen.getByText("Profil")).toBeInTheDocument();
    expect(screen.getByText("Historique")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Accueil")).toBeInTheDocument();
    expect(screen.getByText("Déconnexion")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText("Déconnexion"));
    });

    expect(mockLogout).toHaveBeenCalled();
  });

  it("toggles mobile menu correctly", async () => {
    render(<Navbar />);

    expect(screen.getByTestId("menu-icon")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("menu-icon"));
    });

    expect(screen.getByTestId("close-icon")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("close-icon"));
    });

    expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
  });

  it("calls changeActivePage when clicking navigation buttons", async () => {
    useAppContext.mockReturnValue({
      isAuthenticated: true,
      changeActivePage: mockChangeActivePage,
      logout: mockLogout,
      activePage: "home",
    });

    render(<Navbar />);

    await act(async () => {
      fireEvent.click(screen.getByText("Profil"));
      fireEvent.click(screen.getByText("Historique"));
      fireEvent.click(screen.getByText("Contact"));
      fireEvent.click(screen.getByText("Accueil"));
    });

    expect(mockChangeActivePage).toHaveBeenCalledWith("profile");
    expect(mockChangeActivePage).toHaveBeenCalledWith("history");
    expect(mockChangeActivePage).toHaveBeenCalledWith("contact");
    expect(mockChangeActivePage).toHaveBeenCalledWith("home");
  });
});
