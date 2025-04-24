// stories/Solution.stories.jsx

import React from "react";
import Solution from "./Solution"; // Mettez à jour le chemin si nécessaire

export default {
  title: "Composants/Sécurité/Solution",
  component: Solution,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### 🔐 Composant Solution

Le composant **Solution** présente de manière interactive les trois grandes étapes du processus de sécurisation d’un site web : _Analyse_, _Détection_ et _Correction_.

🌀 Grâce à une **animation horizontale dynamique** gérée par **GSAP** et **ScrollTrigger**, et enrichie par **AOS** et **Framer Motion**, ce composant permet une mise en valeur ludique et professionnelle des services proposés.

🎯 L’objectif est de captiver l’utilisateur tout en lui apportant une compréhension claire des différentes phases de l’audit de sécurité proposé par la plateforme.
        `,
      },
    },
  },
};

const Template = (args) => <Solution {...args} />;

/**
 * 🧪 Cas de test principal : Affichage complet et interactif
 */
export const DémonstrationInteractive = Template.bind({});
DémonstrationInteractive.storyName = "Démonstration interactive";
DémonstrationInteractive.args = {};
