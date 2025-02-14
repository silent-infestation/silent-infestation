import React, { useState } from "react";

import FormTemplate from "../_ui/Forms/FormTemplate";
import Alert from "../Alert/Alert";
import locales from "@/locales";

const Contact = () => {
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });

  const contactFields = [
    { name: "email", placeholder: "ENTER YOUR EMAIL", label: "Email" },
    { name: "subject", placeholder: "SUBJECT", label: "Subject" },
    {
      name: "message",
      type: "textarea",
      placeholder: "YOUR MESSAGE",
      label: "Message",
    },
  ];

  setTimeout(() => {
    setAlert({
      isShowingAlert: false,
      isAlertErrorMessage: false,
      alertTitle: "",
    });
  }, 3000);

  const handleContactSubmit = (data) => {
    if (!data.email || !data.subject || !data.message) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Please fill all fields",
      });
      return;
    }

    if (!data.email.includes("@epitech.eu")) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Email must be an EPITECH email",
      });
      return;
    }

    if (!data.subject || !data.message) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Subject and message cannot be empty",
      });
      return;
    }

    console.log("Form submitted successfully", data);

    // Masquer l'alerte après 3 secondes
    setTimeout(() => {
      setAlert({
        isShowingAlert: false,
        isAlertErrorMessage: false,
        alertTitle: "",
      });
    }, 3000);
  };

  return (
    <>
      <Alert
        isShowingAlert={alert.isShowingAlert}
        isAlertErrorMessage={alert.isAlertErrorMessage}
        alertTitle={alert.alertTitle}
      />
      <div className="flex flex-col items-center p-4 gap-20">
        <h1>{locales.contact.title}</h1>
        <p>{locales.contact.description}</p>
        <div className="flex flex-col w-[20rem] sm:w-[28rem] md:w-[40rem]">
          {/* Formulaire */}
          <FormTemplate
            fields={contactFields}
            onSubmit={handleContactSubmit}
            submitButtonText="SEND MESSAGE"
          />
        </div>
      </div>
    </>
  );
};

export default Contact;
