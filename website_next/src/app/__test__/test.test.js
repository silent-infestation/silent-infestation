jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("@/app/api/test/core", () => ({
  startCrawler: jest.fn(() => Promise.resolve(["https://example.com/form"])),
  performXSSAttempt: jest.fn(() =>
    Promise.resolve({ url: "https://example.com", result: "XSS test" })
  ),
  performAdditionalCheck: jest.fn(() =>
    Promise.resolve({ url: "https://example.com", result: "Additional test" })
  ),
}));

import { POST } from "@/app/api/test/route";
import { startCrawler, performXSSAttempt, performAdditionalCheck } from "@/app/api/test/core";

describe("POST /api/securityscan", () => {
  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  it("renvoie une erreur si l'URL est manquante", async () => {
    const res = await POST(mockRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("startUrl is required");
  });

  it("lance un scan complet avec succès", async () => {
    const res = await POST(mockRequest({ startUrl: "https://example.com" }));
    expect(startCrawler).toHaveBeenCalled();
    expect(performXSSAttempt).toHaveBeenCalled();
    expect(performAdditionalCheck).toHaveBeenCalled();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("crawlerResults");
    expect(data).toHaveProperty("xssResults");
    expect(data).toHaveProperty("additionalCheckResults");
  });
});
