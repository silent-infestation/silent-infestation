"use client";

import React from "react";
import { render, screen } from "@testing-library/react";
import Rgpd from "./Rgpd";

// Mocking AOS (Animate on Scroll) for testing
jest.mock("aos", () => ({
  init: jest.fn(),
}));

describe("Rgpd Component", () => {
  beforeEach(() => {
    render(<Rgpd />);
  });

  test("renders the description text", () => {
    const description = screen.getByText(
      /Nous nous engageons à respecter la confidentialité et la sécurité des données/i
    );
    expect(description).toBeInTheDocument();
  });

  test("AOS animations are initialized", () => {
    const { init } = require("aos");
    expect(init).toHaveBeenCalled();
  });
});
