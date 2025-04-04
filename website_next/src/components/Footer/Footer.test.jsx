import { render, screen } from "@testing-library/react";
import Footer from ".";

// Mock next/link car nous ne voulons pas tester la navigation réelle
jest.mock("next/link", () => {
  function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  }

  return MockLink;
});

describe("Footer", () => {
  it("renders without crashing", () => {
    render(<Footer />);
  });

  it("displays the current year in copyright text", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} Tous droits réservés.`)).toBeInTheDocument();
  });

  it("has correct number of social media icons", () => {
    render(<Footer />);
    const socialIcons = screen.getAllByRole("link");
    expect(socialIcons).toHaveLength(4);
  });
});
