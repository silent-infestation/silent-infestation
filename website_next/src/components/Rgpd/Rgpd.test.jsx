import React from "react";
import { render, screen } from "@testing-library/react";
import Rgpd from "./Rgpd";

// Mock AOS
jest.mock("aos", () => ({
  init: jest.fn(),
}));

// Mock useAppContext
jest.mock("@/app/context/AppContext", () => ({
  useAppContext: () => ({
    changeActivePage: jest.fn(),
  }),
}));

describe("Rgpd Component", () => {
  test("renders the description text", () => {
    render(<Rgpd />);
    const description = screen.getByText(
      /Nous nous engageons à respecter la confidentialité et la sécurité des données/i
    );
    expect(description).toBeInTheDocument();
  });

  test("AOS animations are initialized", () => {
    const { init } = require("aos");
    render(<Rgpd />);
    expect(init).toHaveBeenCalled();
  });
});
