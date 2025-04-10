import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

// Configuration du transporteur SMTP pour Gmail
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Serveur SMTP de Gmail
  port: 587, // Port standard pour STARTTLS
  secure: false, // false pour 587 (STARTTLS), true pour 465 (SSL/TLS)
  auth: {
    user: process.env.EMAIL_USER, // Email Gmail configuré dans .env.local
    pass: process.env.EMAIL_PASSWORD, // Mot de passe d'application généré dans les paramètres Google
  },
});

/**
 * Gestion des requêtes POST pour l'envoi d'emails
 * Cette fonction envoie un email de contact
 *
 * @param {Request} request - L'objet Request contenant les données de la requête
 * @returns {Promise<NextResponse>} Réponse indiquant le succès ou l'échec de l'envoi
 */
export async function POST(request) {
  try {
    // Extraction des données du formulaire de contact
    const { email, subject, message } = await request.json();

    // Validation des données requises
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont requis (email, sujet, message)" },
        { status: 400 }
      );
    }

    // Création du contenu de l'email (HTML et texte)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Message de Contact</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Sujet:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `;

    const textContent = `
      Message de Contact:
      Email: ${email}
      Sujet: ${subject}
      Message: ${message}
    `;

    // Configuration et envoi de l'email
    const info = await transporter.sendMail({
      from: email, // L'email de l'utilisateur qui soumet le formulaire
      to: process.env.EMAIL_USER, // Destinataire (ton adresse email)
      subject: `Nouveau message de contact: ${subject}`, // Sujet de l'email
      text: textContent, // Version texte
      html: htmlContent, // Version HTML du message
    });

    // Réponse en cas de succès
    return NextResponse.json({
      success: true,
      messageId: info.messageId, // Identifiant unique de l'email envoyé
    });
  } catch (error) {
    // Gestion des erreurs
    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
