// Footer.stories.tsx
import React from "react";
import Footer from "../components/Footer"; // Ajustez le chemin d'import selon votre structure

export default {
  title: "Composants/Footer",
  component: Footer,
};

const Template = () => <Footer />;

export const Default = Template.bind({});
Default.args = {};
