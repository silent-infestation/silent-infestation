import { NextResponse } from "next/server";
import {
  transporter,
  generateSecurityCredentials,
  createSecurityEmailContent,
  createContactEmailContent,
} from "./core";

export async function POST(request) {
  try {
    const { type, email, sujet, message, destinataire } = await request.json();

    if (!type || !sujet || !message) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    let mailOptions = {};
    let extraData = {};

    if (type === "contact") {
      if (!email) {
        return NextResponse.json(
          { error: "Email requis pour un message de contact." },
          { status: 400 }
        );
      }

      mailOptions = {
        from: `"Contact App" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL,
        replyTo: email,
        subject: `[Contact App] ${sujet}`,
        text: `${message}\n\nEnvoyé par : ${email}`,
        html: createContactEmailContent(email, sujet, message),
      };
    } else if (type === "security") {
      if (!destinataire) {
        return NextResponse.json(
          { error: "Destinataire requis pour un mail de sécurité." },
          { status: 400 }
        );
      }

      const { securityKey, urlPath } = generateSecurityCredentials();

      mailOptions = {
        from: process.env.EMAIL_USER,
        to: destinataire,
        subject: sujet,
        text: `${message}\n\nURL : http://votresite.com/${urlPath}\nClé : ${securityKey}`,
        html: createSecurityEmailContent(message, securityKey, urlPath),
      };

      extraData = {
        credentials: {
          securityKey,
          urlPath,
          destinataire,
          createdAt: new Date().toISOString(),
        },
      };
    } else {
      return NextResponse.json({ error: "Type d'email inconnu." }, { status: 400 });
    }

    const info = await transporter.sendMail(mailOptions);
    await transporter.verify().catch((err) => {
      console.error("[MAILER] Erreur transporteur :", err);
    });

    return NextResponse.json({ success: true, messageId: info.messageId, ...extraData });
  } catch (error) {
    return NextResponse.json({ error: "Erreur email", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Service email opérationnel",
    timestamp: new Date().toISOString(),
  });
}
