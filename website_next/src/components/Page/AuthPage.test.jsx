import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// ✅ Mocks directement dans les factories
jest.mock("../Authentification/Login", () => {
  const MockLogin = () => <div>Login Component</div>;
  MockLogin.displayName = "MockLogin";
  return {
    __esModule: true,
    default: MockLogin,
  };
});

jest.mock("../Authentification/Register", () => {
  const MockRegister = () => <div>Register Component</div>;
  MockRegister.displayName = "MockRegister";
  return {
    __esModule: true,
    default: MockRegister,
  };
});

// ✅ Ensuite on importe le composant testé
import AuthPage from "./AuthPage";

describe("AuthPage", () => {
  test("renders the page with Login initially", () => {
    render(<AuthPage />);
    expect(screen.getByText("Login Component")).toBeInTheDocument();
    expect(screen.getByText("Connexion")).toHaveClass("text-2xl font-bold text-[#05829e]");
    expect(screen.getByText("Inscription")).toHaveClass("text-base text-gray-500");
  });

  test('renders Register when "Inscription" button is clicked', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText("Inscription"));
    expect(screen.getByText("Register Component")).toBeInTheDocument();
    expect(screen.getByText("Inscription")).toHaveClass("text-2xl font-bold text-[#05829e]");
    expect(screen.getByText("Connexion")).toHaveClass("text-base text-gray-500");
  });

  test("the animated bar moves correctly when switching between Login and Register", () => {
    render(<AuthPage />);
    const animatedBar = screen.getByTestId("animated-bar");
    expect(animatedBar).toHaveStyle("left: 0%");
    fireEvent.click(screen.getByText("Inscription"));
    expect(animatedBar).toHaveStyle("left: 50%");
  });

  test("correct CSS classes are applied to the buttons", () => {
    render(<AuthPage />);
    expect(screen.getByText("Connexion")).toHaveClass("text-2xl font-bold text-[#05829e]");
    expect(screen.getByText("Inscription")).toHaveClass("text-base text-gray-500");
    fireEvent.click(screen.getByText("Inscription"));
    expect(screen.getByText("Inscription")).toHaveClass("text-2xl font-bold text-[#05829e]");
    expect(screen.getByText("Connexion")).toHaveClass("text-base text-gray-500");
  });

  test("switching back to login from register updates content and styles", () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText("Inscription"));
    expect(screen.getByText("Register Component")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Connexion"));
    expect(screen.getByText("Login Component")).toBeInTheDocument();
    expect(screen.getByText("Connexion")).toHaveClass("text-2xl font-bold text-[#05829e]");
  });

  test("animated bar stays at left when clicking Connexion multiple times", () => {
    render(<AuthPage />);
    const bar = screen.getByTestId("animated-bar");
    fireEvent.click(screen.getByText("Connexion"));
    expect(bar).toHaveStyle("left: 0%");
    fireEvent.click(screen.getByText("Connexion"));
    expect(bar).toHaveStyle("left: 0%");
  });

  test("animated bar stays at right when clicking Inscription multiple times", () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText("Inscription"));
    const bar = screen.getByTestId("animated-bar");
    fireEvent.click(screen.getByText("Inscription"));
    expect(bar).toHaveStyle("left: 50%");
  });
});
