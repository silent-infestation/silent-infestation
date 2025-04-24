import { useState } from "react";
import Alert from "./Alert";
import { action } from "@storybook/addon-actions";

export default {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    onClose: { action: "closed" },
    isShowingAlert: { control: "boolean" },
    isAlertErrorMessage: { control: "boolean" },
    alertTitle: { control: "text" },
  },
  parameters: {
    layout: "fullscreen",
  },
};

function StatefulAlert(props) {
  const [open, setOpen] = useState(props.isShowingAlert);

  return (
    <Alert
      {...props}
      isShowingAlert={open}
      onClose={() => {
        setOpen(false);
        action("closed")();
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
