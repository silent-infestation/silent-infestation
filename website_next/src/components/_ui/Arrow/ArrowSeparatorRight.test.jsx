import React from "react";
import { render } from "@testing-library/react";
import ArrowSeparatorRight from "./ArrowSeparatorRight";

describe("ArrowSeparatorRight", () => {
  it("render les éléments visuels (ligne et flèche)", () => {
    const { container } = render(<ArrowSeparatorRight />);

    const line = container.querySelector("div.h-1.w-80");
    expect(line).toBeInTheDocument();

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});
