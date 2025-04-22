import React from "react";
import { render } from "@testing-library/react";
import ArrowSeparatorLeft from "./ArrowSeparatorLeft";

describe("ArrowSeparatorLeft", () => {
  it("render les éléments visuels (flèche et ligne)", () => {
    const { container } = render(<ArrowSeparatorLeft />);

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const line = container.querySelector("div.h-1.w-80");
    expect(line).toBeInTheDocument();
  });
});
