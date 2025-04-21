import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react-dom/test-utils";
import Solution from "./Solution.jsx";

// MOCK: IntersectionObserver
global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
  unobserve() {}
};

// MOCK de framer-motion
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    ...jest.requireActual("framer-motion"),
    motion: new Proxy(
      {},
      {
        get:
          () =>
          ({ children, ...props }) =>
            React.createElement("div", props, children),
      }
    ),
  };
});

// MOCK de AOS
jest.mock("aos", () => ({
  init: jest.fn(),
}));

// MOCK de GSAP
jest.mock("gsap", () => {
  const scrollTrigger = {
    getAll: jest.fn(() => []),
  };
  return {
    to: jest.fn(),
    registerPlugin: jest.fn(),
    ScrollTrigger: scrollTrigger,
    default: {
      registerPlugin: jest.fn(),
      ScrollTrigger: scrollTrigger,
    },
  };
});

describe("Solution Component", () => {
  test("should render icons and base descriptions", () => {
    render(React.createElement(Solution));

    const icons = screen.getAllByText(/📊|🔍|🛠️/);
    expect(icons.length).toBeGreaterThanOrEqual(3);

    expect(screen.getByText(/Notre outil scanne votre site en profondeur/)).toBeInTheDocument();

    expect(screen.getByText(/Nous détectons les vulnérabilités/)).toBeInTheDocument();

    expect(screen.getByText(/Bénéficiez de recommandations/)).toBeInTheDocument();
  });

  test("should trigger AOS init", () => {
    const AOS = require("aos");
    render(React.createElement(Solution));
    expect(AOS.init).toHaveBeenCalled();
  });

  test("should initialize GSAP scroll trigger", async () => {
    const gsap = require("gsap");
    render(React.createElement(Solution));
    await waitFor(() => {
      expect(gsap.to).toHaveBeenCalled();
    });
  });

  test("should update activeIndex on scroll", async () => {
    const gsap = require("gsap");
    render(React.createElement(Solution));

    act(() => {
      const scrollTrigger = gsap.to.mock.calls[0][1].scrollTrigger;
      scrollTrigger.onUpdate({ progress: 0.5 });
    });

    await waitFor(() => {
      const allMatches = screen.getAllByText("Détecte");
      const horizontalCard = allMatches.find((el) => el.closest(".solution-card"));
      expect(horizontalCard).toBeInTheDocument();
    });
  });

  // ✅ Tests des descriptions détaillées (section en quinconce)
  test("should render detailed Analyse section", () => {
    render(React.createElement(Solution));
    expect(screen.getByText(/analyse approfondie de votre site web/i)).toBeInTheDocument();
  });

  test("should render detailed Détecte section", () => {
    render(React.createElement(Solution));
    expect(screen.getByText(/vulnérabilités détectées en les classant/i)).toBeInTheDocument();
  });

  test("should render detailed Corrige section", () => {
    render(React.createElement(Solution));
    expect(screen.getByText(/correctifs adaptés aux failles détectées/i)).toBeInTheDocument();
  });
});
