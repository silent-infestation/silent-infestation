/* @jest-environment node */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// -----------------------
// 1.  Mock dependencies
// -----------------------

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    site: {
      update: jest.fn(),
    },
  },
}));

// Mock core helpers (mailer + helpers)
jest.mock("@/app/api/mailer/core", () => ({
  transporter: {
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-message-id" }),
    verify: jest.fn().mockResolvedValue(undefined),
  },
  generateSecurityCredentials: jest.fn(() => ({
    securityKey: "mock-security-key",
    urlPath: "mock-url-path",
  })),
  createSecurityEmailContent: jest.fn(() => "<p>security-email-content</p>"),
  createContactEmailContent: jest.fn(() => "<p>contact-email-content</p>"),
}));

// Mock NextResponse so we can easily inspect what the route returns
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init = {}) => ({
      data,
      status: init.status ?? 200,
    })),
  },
}));

// -----------------------
// 2.  Imports *after* mocks
// -----------------------

import { POST, GET } from "@/app/api/mailer/route";
import { prisma } from "@/lib/prisma";
import { transporter, createContactEmailContent } from "@/app/api/mailer/core";

/*
 Utility helper: creates a fake Next.js Request-like object whose json() method
 resolves to the provided body.
*/
const createRequest = (body) => ({
  json: jest.fn().mockResolvedValue(body),
});

// -----------------------
// 3.  Test suite
// -----------------------

describe("/api/mail route", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Provide deterministic environment variables for the tests
    process.env.EMAIL_USER = "service@example.com";
    process.env.ADMIN_EMAIL = "admin@example.com";
  });

  // -----------------------
  //   GET handler
  // -----------------------
  it("GET should return operational status with 200", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.data.status).toBe("Service email opérationnel");
    expect(res.data.timestamp).toBeDefined();
  });

  // -----------------------
  //   POST – validation errors
  // -----------------------
  it("POST should 400 when type is missing", async () => {
    const req = createRequest({ email: "john@example.com" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.data.error).toBe("Champs requis manquants.");
  });

  it("POST contact should 400 when email is missing", async () => {
    const req = createRequest({ type: "contact", url: "https://site.com" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.data.error).toBe("Email requis pour un message de contact.");
  });

  it("POST security should 400 when destinataire is missing", async () => {
    const req = createRequest({ type: "security", siteId: 1, url: "https://site.com" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.data.error).toBe("Destinataire requis pour un mail de sécurité.");
  });

  it("POST should 400 on unknown type", async () => {
    const req = createRequest({ type: "unknown" });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.data.error).toBe("Type d'email inconnu.");
  });

  // -----------------------
  //   POST – happy paths
  // -----------------------
  it("POST contact should send email and respond 200", async () => {
    const req = createRequest({
      type: "contact",
      email: "jane@example.com",
      url: "https://site.com",
    });

    const res = await POST(req);

    // Verify response
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.messageId).toBe("test-message-id");

    // Verify mailer helpers were called appropriately
    expect(createContactEmailContent).toHaveBeenCalledWith(
      "jane@example.com",
      "Contact Silentinfestation",
      expect.any(String)
    );

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const mailArgs = transporter.sendMail.mock.calls[0][0];
    expect(mailArgs.replyTo).toBe("jane@example.com");
    expect(mailArgs.to).toBe("admin@example.com");
  });

  it("POST contact succeeds even if transporter.verify fails", async () => {
    // force verify to reject so we execute the internal catch arrow function
    transporter.verify.mockRejectedValueOnce(new Error("verify boom"));

    const req = createRequest({
      type: "contact",
      email: "foo@example.com",
      url: "https://site.com",
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(transporter.verify).toHaveBeenCalled();
  });

  it("POST contact returns 500 if transporter.sendMail fails", async () => {
    // Arrange: make sendMail throw so we hit the outer catch of POST
    transporter.sendMail.mockRejectedValueOnce(new Error("send fail"));

    const req = createRequest({
      type: "contact",
      email: "oops@example.com",
      url: "https://site.com",
    });

    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(res.data.error).toBe("Erreur email");
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
  });

  it("POST security should update site, send email, and respond 200", async () => {
    // Arrange
    prisma.site.update.mockResolvedValue({ id: 42 });

    const req = createRequest({
      type: "security",
      destinataire: "dest@example.com",
      url: "https://site.com",
      siteId: 42,
    });

    // Act
    const res = await POST(req);

    // Assert response basics
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.credentials).toEqual(
      expect.objectContaining({
        securityKey: "mock-security-key",
        urlPath: "mock-url-path",
        destinataire: "dest@example.com",
      })
    );

    // Ensure DB update occurred with the right payload
    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        securityKey: "mock-security-key",
        urlPath: "mock-url-path",
        state: "unverified",
      },
    });

    // Ensure an email was sent
    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const sentMailOptions = transporter.sendMail.mock.calls[0][0];
    expect(sentMailOptions.to).toBe("dest@example.com");
  });

  // -----------------------
  //   POST – DB error path
  // -----------------------
  it("POST security responds 500 if prisma update fails", async () => {
    // Arrange: make prisma throw
    prisma.site.update.mockRejectedValue(new Error("DB fail"));

    const req = createRequest({
      type: "security",
      destinataire: "dest@example.com",
      url: "https://site.com",
      siteId: 99,
    });

    // Act
    const res = await POST(req);

    // Assert
    expect(res.status).toBe(500);
    expect(res.data.error).toBe("Erreur lors de la mise à jour du site");
  });
});
