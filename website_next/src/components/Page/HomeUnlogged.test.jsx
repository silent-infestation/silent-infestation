import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import HomeUnlogged from "./HomeUnlogged";

function MockHeader() {
  return <div>Mock Header</div>;
}
function MockAbout() {
  return <div>Mock About</div>;
}
function MockSolution() {
  return <div>Mock Solution</div>;
}
function MockRgpd() {
  return <div>Mock RGPD</div>;
}
function MockTeam() {
  return <div>Mock Team</div>;
}
function MockLeftArrow() {
  return <div>Left Arrow</div>;
}
function MockRightArrow() {
  return <div>Right Arrow</div>;
}

jest.mock("@/components/Header/Header", () => ({
  __esModule: true,
  default: () => <MockHeader />,
}));

jest.mock("@/components/About/About", () => ({
  __esModule: true,
  default: () => <MockAbout />,
}));

jest.mock("@/components/Solution/Solution", () => ({
  __esModule: true,
  default: () => <MockSolution />,
}));

jest.mock("@/components/Rgpd/Rgpd", () => ({
  __esModule: true,
  default: () => <MockRgpd />,
}));

jest.mock("@/components/Team/index", () => ({
  __esModule: true,
  default: () => <MockTeam />,
}));

jest.mock("@/components/_ui/Arrow/ArrowSeparatorLeft", () => ({
  __esModule: true,
  default: () => <MockLeftArrow />,
}));

jest.mock("@/components/_ui/Arrow/ArrowSeparatorRight", () => ({
  __esModule: true,
  default: () => <MockRightArrow />,
}));

describe("HomeUnlogged", () => {
  test("rend tous les composants attendus", () => {
    render(<HomeUnlogged />);

    expect(screen.getByText("Mock Header")).toBeInTheDocument();
    expect(screen.getAllByText("Left Arrow")).toHaveLength(2);
    expect(screen.getAllByText("Right Arrow")).toHaveLength(2);
    expect(screen.getByText("Mock About")).toBeInTheDocument();
    expect(screen.getByText("Mock Solution")).toBeInTheDocument();
    expect(screen.getByText("Mock RGPD")).toBeInTheDocument();
    expect(screen.getByText("Mock Team")).toBeInTheDocument();
  });
});
