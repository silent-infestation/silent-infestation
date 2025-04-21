// stories/Header.stories.jsx

import React from "react";
import Header from "./Header"; // Mettez à jour le chemin selon l'arborescence

export default {
  title: "Composants/Accueil/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### 🧠 Composant Header – Accueil interactif & Scan de site web

Le composant **Header** constitue l’élément central de la page d’accueil. Il allie animation, onboarding utilisateur, et déclenchement du scan de sécurité.

🌟 Il contient :
- Une **animation typographique** cyclique via \`react-type-animation\`
- Un **bouton de scan interactif** avec effets visuels via \`framer-motion\`
- Une **popup contextuelle** guidant l’utilisateur à travers :
  - La sélection d’une URL vérifiée
  - La simulation de progression du scan
  - Le téléchargement du rapport de sécurité
- Une gestion avancée de **l’état global utilisateur** via \`useAppContext\` et \`useAuth\`

🛠️ Ce composant combine **UX moderne**, **sécurité**, et **intégration backend**, idéal pour lancer une plateforme d’audit automatisé.

🧪 Pour un rendu complet dans Storybook, un mock de contexte utilisateur et des réponses API peuvent être nécessaires.
        `,
      },
    },
  },
};

const Template = (args) => <Header {...args} />;

/**
 * 🧪 Cas de test principal : Vue interactive de l'accueil
 */
export const HeaderInteractive = Template.bind({});
HeaderInteractive.storyName = "Vue accueil interactive";
HeaderInteractive.args = {};
