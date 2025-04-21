import crypto from "crypto";
import nodemailer from "nodemailer";

// Configuration du transporteur SMTP pour Gmail
// Cette configuration est utilisée pour établir la connexion avec le serveur SMTP de Gmail
export const transporter = nodemailer.createTransport({
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
export function generateSecurityCredentials() {
  const securityKey = crypto.randomBytes(128).toString("hex"); // Génère 16 octets -> 32 caractères hex
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
export function createSecurityEmailContent(securityKey, urlPath, url) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0066cc;">
        <h3 style="color: #0066cc; margin-top: 0;">Instructions de sécurité</h3>
        <p>Afin d'assurer que vous êtes bien le propriétaire du site que vous voulez auditer, suivez ces étapes :</p>
        <ol>
          <li>Créez cette page : <strong>${url}/${urlPath}</strong></li>
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
 * Crée le contenu de l'email pour le message de contact
 * @param {string} email
 * @param {string} sujet
 * @param {string} message
 * @returns {string} Contenu HTML formaté de l'email
 */
export function createContactEmailContent(email, sujet, message) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Nouveau message de contact</h2>
      <p><strong>De :</strong> ${email}</p>
      <p><strong>Sujet :</strong> ${sujet}</p>
      <p>${message.replace(/\n/g, "<br/>")}</p>
    </div>
  `;
}
