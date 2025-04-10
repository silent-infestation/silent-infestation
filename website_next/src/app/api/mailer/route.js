// app/api/mail/route.js
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import crypto from "crypto"; // Module natif Node.js pour la cryptographie

// Configuration du transporteur SMTP pour Gmail
// Cette configuration est utilisée pour établir la connexion avec le serveur SMTP de Gmail
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
 * Génère les identifiants de sécurité pour l'authentification
 * Crée une clé unique et une URL personnalisée pour l'accès sécurisé
 *
 * @returns {Object} Un objet contenant la clé de sécurité et le chemin URL
 * @property {string} securityKey - Clé hexadécimale de 32 caractères
 * @property {string} urlPath - Chemin URL unique de 24 caractères
 */
function generateSecurityCredentials() {
  const securityKey = crypto.randomBytes(16).toString("hex"); // Génère 16 octets -> 32 caractères hex
  const urlPath = crypto.randomBytes(12).toString("hex"); // Génère 12 octets -> 24 caractères hex
  return { securityKey, urlPath };
}

/**
 * Crée le contenu de l'email avec les instructions de sécurité
 * Formate le message en HTML avec la clé et l'URL d'accès
 * @param {string} securityKey - Clé de sécurité générée
 * @param {string} urlPath - Chemin URL généré
 * @returns {string} Contenu HTML formaté de l'email
 */
function createSecurityEmailContent(securityKey, urlPath) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc;">
        <h3 style="color: #0066cc; margin-top: 0;">Instructions de sécurité</h3>
        <p>Afin d'assurer que vous êtes bien le propriétaire du site que vous voulez auditer, suivez ces étapes :</p>
        <ol>
          <li>Créez cette page : <strong>http://votresite.com/${urlPath}</strong></li>
          <li>Ajoutez-y cette clé de sécurité : <strong>${securityKey}</strong></li>
        </ol>
      </div>
      
      <p style="color: #666; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 15px;">
        Important : Cette clé est personnelle et ne doit pas être partagée.
      </p>
    </div>
  `;
}

/**
 * Gestion des requêtes POST pour l'envoi d'emails sécurisés
 * Cette fonction traite les requêtes entrantes, génère les credentials de sécurité
 * et envoie un email contenant les instructions d'accès
 *
 * @param {Request} request - L'objet Request contenant les données de la requête
 * @returns {Promise<NextResponse>} Réponse indiquant le succès ou l'échec de l'envoi
 */
export async function POST(request) {
  try {
    // Extraction des données de la requête
    const { destinataire, sujet, message } = await request.json();

    // Validation des données requises
    if (!destinataire || !sujet || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont requis (destinataire, sujet, message)" },
        { status: 400 }
      );
    }

    // Génération des credentials de sécurité
    const { securityKey, urlPath } = generateSecurityCredentials();

    // Création du contenu HTML sécurisé
    const htmlContent = createSecurityEmailContent(message, securityKey, urlPath);

    // Configuration et envoi de l'email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER, // Expéditeur (doit correspondre à l'email authentifié)
      to: destinataire, // Destinataire(s)
      subject: sujet, // Sujet de l'email
      text: `${message}\n\nURL d'accès : http://votresite.com/${urlPath}\nClé de sécurité : ${securityKey}`, // Version texte
      html: htmlContent, // Version HTML du message
    });

    // Réponse en cas de succès avec les credentials générés
    return NextResponse.json({
      success: true,
      messageId: info.messageId, // Identifiant unique de l'email envoyé
      credentials: {
        // Credentials à sauvegarder côté serveur
        securityKey,
        urlPath,
        destinataire,
        createdAt: new Date().toISOString(),
      },
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

/**
 * Gestion des requêtes GET pour vérifier le statut du service
 * Utile pour les tests de disponibilité (health check)
 */
export async function GET() {
  return NextResponse.json({
    status: "Service email opérationnel",
    timestamp: new Date().toISOString(),
  });
}
