import React from "react";
import Footer from ".";

export default {
  title: "Composants/Structure/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### 📎 Composant Footer – Pied de page de l'application

Le composant **Footer** constitue le pied de page global de l’application.

🔗 Il contient :
- Des **liens vers les réseaux sociaux** : Instagram et GitHub (avec ouverture dans un nouvel onglet)
- Une **mention légale** automatique avec l'année en cours

✨ Ce composant assure une **présence constante et discrète**, tout en renforçant l’identité visuelle de la plateforme.

🎨 Couleurs : 
- Fond : \`#00202b\`
- Texte : \`#f8f2e2\`
- Hover : gris clair pour les icônes de réseaux
        `,
      },
    },
  },
};

const Template = (args) => <Footer {...args} />;

export const FooterStandard = Template.bind({});
FooterStandard.storyName = "Pied de page standard";
FooterStandard.args = {};
