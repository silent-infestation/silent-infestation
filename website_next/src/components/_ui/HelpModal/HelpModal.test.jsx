import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import HelpModal from "./HelpModal";
import { useAppContext } from "@/app/context/AppContext";

jest.mock("@/app/context/AppContext", () => ({
  useAppContext: jest.fn(),
}));

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("HelpModal Component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("shows modal after delay", async () => {
    useAppContext.mockReturnValue({ activePage: "testPage" });

    render(<HelpModal imageSrc="test.jpg" title="Test Title" text="Test Text" />);

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000); // le délai par défaut
    });

    expect(await screen.findByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Text")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "test.jpg");
  });

  test("does not show modal if disabled in localStorage", () => {
    window.localStorage.setItem(
      "helpModal",
      JSON.stringify({
        testPage: { disabled: true, nextDelay: 1000, lastClosed: null },
      })
    );

    useAppContext.mockReturnValue({ activePage: "testPage" });

    render(<HelpModal imageSrc="test.jpg" title="Test Title" text="Test Text" />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
  });

  test("closes modal and updates delay when close button is clicked", () => {
    useAppContext.mockReturnValue({ activePage: "testPage" });

    render(<HelpModal imageSrc="test.jpg" title="Test Title" text="Test Text" />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText("Test Title")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Fermer"));

    expect(screen.queryByText("Test Title")).not.toBeInTheDocument();

    const savedState = JSON.parse(localStorage.getItem("helpModal")).testPage;
    expect(savedState.nextDelay).toBe(2000); // nextDelay doublé
    expect(savedState.lastClosed).not.toBeNull();
  });

  test("disables modal when 'Ne plus jamais afficher' is clicked", () => {
    useAppContext.mockReturnValue({ activePage: "testPage" });

    render(<HelpModal imageSrc="test.jpg" title="Test Title" text="Test Text" />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByText("Ne plus jamais afficher"));

    const savedState = JSON.parse(localStorage.getItem("helpModal")).testPage;
    expect(savedState.disabled).toBe(true);
  });
});
