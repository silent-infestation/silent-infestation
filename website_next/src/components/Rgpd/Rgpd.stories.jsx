// stories/Rgpd.stories.jsx

import React from "react";
import Rgpd from "./Rgpd"; // Mettez à jour le chemin si nécessaire

export default {
  title: "Composants/RGPD", // 🏷️ Catégorie et nom du composant dans Storybook
  component: Rgpd,
  parameters: {
    layout: "fullscreen", // Utilise toute la largeur pour correspondre au rendu réel
    docs: {
      description: {
        component: `
Le composant **Rgpd** affiche un engagement clair de la plateforme en matière de conformité au RGPD (Règlement Général sur la Protection des Données).

💡 Il utilise des animations AOS pour enrichir l'expérience utilisateur, et intègre le contexte global de l'application pour permettre la navigation vers la page de contact.

🔒 Transparence, sécurité et responsabilité sont mises en avant à travers des éléments visuels accessibles et modernes.
        `,
      },
    },
  },
};

const Template = (args) => <Rgpd {...args} />;

/**
 * 🧪 Cas de test principal : Affichage standard
 */
export const AffichageParDéfaut = Template.bind({});
AffichageParDéfaut.storyName = "Affichage par défaut";
AffichageParDéfaut.args = {};
