jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      status: init?.status || 200,
      headers: init?.headers || {},
      json: () => Promise.resolve(data),
    })),
  },
}));

jest.mock("@/app/api/mailer/core", () => ({
  transporter: {
    sendMail: jest.fn(() => Promise.resolve({ messageId: "mock-id" })),
    verify: jest.fn(() => Promise.resolve(true)),
  },
  generateSecurityCredentials: jest.fn(() => ({
    securityKey: "mock-key",
    urlPath: "mock-path",
  })),
  createSecurityEmailContent: jest.fn(() => "<p>security HTML</p>"),
  createContactEmailContent: jest.fn(() => "<p>contact HTML</p>"),
}));

// ⛔️ Pas de `import { POST } ...` ici ! 👇
describe.only("POST /api/mailer", () => {
  let POST;

  beforeAll(() => {
    // ✅ importer dynamiquement APRÈS les mocks
    POST = require("@/app/api/mailer/handler").POST;
  });

  const mockRequest = (body) => ({
    json: () => Promise.resolve(body),
  });

  it("renvoie une erreur si des champs requis sont manquants", async () => {
    const response = await POST(mockRequest({ type: "contact" }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Champs requis/i);
  });

  it("gère un mail de contact valide", async () => {
    const response = await POST(
      mockRequest({ type: "contact", email: "user@test.com", sujet: "Test", message: "Coucou" })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("gère un mail de sécurité valide", async () => {
    const response = await POST(
      mockRequest({
        type: "security",
        destinataire: "admin@test.com",
        sujet: "Sécurité",
        message: "Voici le message",
      })
    );
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.credentials).toBeDefined();
  });

  it("renvoie une erreur si le type est inconnu", async () => {
    const response = await POST(mockRequest({ type: "autre", sujet: "x", message: "y" }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toMatch(/Type.*inconnu/);
  });
});
