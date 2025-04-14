jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(data),
      headers: init?.headers || {},
    })),
  },
}));

jest.mock("@/app/api/bruteforce/core", () => ({
  startBruteforceTesting: jest.fn(() =>
    Promise.resolve([{ formUrl: "https://example.com/login", findings: {} }])
  ),
  generateSummaryReport: jest.fn(() => ({
    totalFormsTested: 1,
    protectedForms: 1,
  })),
}));

import { POST } from "@/app/api/bruteforce/route";
import { startBruteforceTesting, generateSummaryReport } from "@/app/api/bruteforce/core";

describe("POST /api/bruteforce", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  it("renvoie une erreur 400 si startUrl est manquant", async () => {
    const response = await POST(mockRequest({}));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("startUrl is required");
  });

  it("renvoie les résultats et le rapport si startUrl est présent", async () => {
    const response = await POST(mockRequest({ startUrl: "https://example.com" }));
    const data = await response.json();

    expect(startBruteforceTesting).toHaveBeenCalledWith("https://example.com");
    expect(generateSummaryReport).toHaveBeenCalled();

    expect(response.status).toBe(200);
    expect(data.bruteforceResults).toBeDefined();
    expect(data.summaryReport.totalFormsTested).toBe(1);
  });
});
