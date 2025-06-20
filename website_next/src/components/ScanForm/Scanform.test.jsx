import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScanForm from ".";

// Mock de fetch
global.fetch = jest.fn();

// IMPORTANT
// Skip le test en attendant ScanForm Component soit implémenté
// N'oubliez pas d'implémenter vos tests ici !
// IMPORTANT
describe.skip("ScanForm Component", () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
  });

  it("renders the form with initial state", () => {
    render(<ScanForm />);

    expect(screen.getByText("Submit a URL")).toBeInTheDocument();
    expect(screen.getByLabelText("URL:")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveTextContent("Submit");
    expect(screen.queryByText("Processing...")).not.toBeInTheDocument();
  });

  it("updates URL input value on change", async () => {
    render(<ScanForm />);

    const input = screen.getByLabelText("URL:");
    const testUrl = "https://example.com";

    await act(async () => {
      await userEvent.type(input, testUrl);
    });

    expect(input.value).toBe(testUrl);
  });

  it("shows loading state during form submission", async () => {
    fetch.mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(<ScanForm />);

    const input = screen.getByLabelText("URL:");
    const submitButton = screen.getByRole("button");

    await act(async () => {
      await userEvent.type(input, "https://example.com");
      fireEvent.click(submitButton);
    });

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Submitting...");
  });

  it("correctly sends form data to API", async () => {
    const testUrl = "https://example.com";
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Success" }),
      })
    );

    render(<ScanForm />);

    const input = screen.getByLabelText("URL:");
    const submitButton = screen.getByRole("button");

    await act(async () => {
      await userEvent.type(input, testUrl);
      fireEvent.click(submitButton);
    });

    expect(fetch).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startUrl: testUrl }),
    });
  });
});
