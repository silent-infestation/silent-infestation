// src/components/Alert/Alert.stories.jsx
import { useState } from "react";
import Alert from "./Alert";
import { action } from "@storybook/addon-actions";

export default {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "closed" }, // journalise la fermeture
    isShowingAlert: { control: "boolean" },
    isAlertErrorMessage: { control: "boolean" },
    alertTitle: { control: "text" },
  },
  parameters: {
    layout: "fullscreen",
  },
};

/**
 * Petit wrapper pour pouvoir montrer / masquer l'alerte
 * via les Controls sans déclencher le timeout interne.
 */
function StatefulAlert(props) {
  const [open, setOpen] = useState(props.isShowingAlert);

  return (
    <Alert
      {...props}
      isShowingAlert={open}
      onClose={() => {
        setOpen(false);
        action("closed")(); // consigne dans l'onglet “Actions”
      }}
    />
  );
}

export const Success = {
  args: {
    isShowingAlert: true,
    isAlertErrorMessage: false,
    alertTitle: "Opération réussie !",
  },
  render: (args) => <StatefulAlert {...args} />,
};

export const Error = {
  args: {
    isShowingAlert: true,
    isAlertErrorMessage: true,
    alertTitle: "Une erreur est survenue.",
  },
  render: (args) => <StatefulAlert {...args} />,
};

export const Hidden = {
  args: {
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "—",
  },
  render: (args) => <StatefulAlert {...args} />,
};
