import React from "react";
import Team from "."; 

export default {
  title: "Composants/Présentation/Équipe",
  component: Team,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### 👩‍💻 Composant Team – Présentation de l’équipe

Le composant **Team** présente les membres de l'équipe avec une mise en page dynamique et animée. Il s’agit d’un affichage clair, esthétique et responsive de votre dream team de développeurs et spécialistes cybersécurité.

🌟 Chaque carte affiche :
- La **photo** du membre
- Son **nom**
- Son **rôle** avec une icône ⭐️
- Une **description professionnelle** de ses responsabilités techniques

✨ Des animations [AOS](https://michalsnik.github.io/aos/) sont utilisées pour créer un effet d’apparition fluide à chaque défilement de la page.

👨‍💼 Ce composant contribue à renforcer la crédibilité de l’équipe projet et humanise votre plateforme d’audit de sécurité.
        `,
      },
    },
  },
};

const Template = (args) => <Team {...args} />;


export const PrésentationÉquipe = Template.bind({});
PrésentationÉquipe.storyName = "Présentation de l’équipe";
PrésentationÉquipe.args = {};
