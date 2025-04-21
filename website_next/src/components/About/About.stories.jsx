// src/components/About/About.stories.jsx
import About from "./About";

// Configuration du bloc “Docs” + lien avec le composant
export default {
  title: "Components/About", // Chemin dans la barre latérale
  component: About,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen", // occupe toute la largeur
    backgrounds: {
      // fond Storybook clair par défaut
      default: "light",
    },
  },
};

export const Default = {};
