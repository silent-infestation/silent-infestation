import React from "react";
import Contact from ".";

export default {
  title: "Composants/Formulaires/Contact",
  component: Contact,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
### 📬 Composant Contact – Formulaire d’assistance

Le composant **Contact** permet aux utilisateurs de prendre contact avec votre équipe via un formulaire structuré, sécurisé et visuellement attractif.

💡 Il inclut :
- Une **animation de titre dynamique** via \`react-type-animation\`
- Des **champs personnalisés** pour l’email, le sujet et le message
- Une **validation HTML5**
- Un système d’**alerte** (succès ou erreur) via le composant \`Alert\`
- Une intégration backend via une requête POST à \`/mailer\`

🎨 Le design utilise TailwindCSS pour une présentation responsive, propre et conviviale.
        `,
      },
    },
  },
};

const Template = (args) => <Contact {...args} />;

export const FormulaireDeContact = Template.bind({});
FormulaireDeContact.storyName = "Formulaire de contact";
FormulaireDeContact.args = {};
