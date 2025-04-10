// pages/api/sites.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url_site, auth_email } = req.body;

    if (!url_site || !auth_email) {
      return res.status(400).json({ message: "URL et email d'authentification sont requis." });
    }

    try {
      // Générer un auth_key et auth_url (par exemple en utilisant une bibliothèque ou une logique spécifique)
      const auth_key = generateAuthKey(); // Implémentez la logique de génération de auth_key
      const auth_url = generateAuthUrl(); // Implémentez la logique de génération de auth_url

      // Ajouter l'URL à la base de données
      const newSite = await prisma.site.create({
        data: {
          url_site,
          auth_key,
          auth_url,
          auth_email,
          id_user: 1, // Remplacez par l'ID utilisateur actuel, par exemple à partir d'un token JWT
        },
      });

      return res.status(201).json(newSite);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur lors de l'ajout du site." });
    }
  } else {
    res.status(405).json({ message: 'Méthode non autorisée' });
  }
}

// Fonction pour générer un auth_key (exemple simple, remplacez par une méthode plus robuste)
function generateAuthKey() {
  return Math.random().toString(36).substring(2, 15);
}

// Fonction pour générer un auth_url (exemple simple, remplacez par une méthode plus robuste)
function generateAuthUrl() {
  return `https://example.com/auth/${Math.random().toString(36).substring(2, 15)}`;
}
