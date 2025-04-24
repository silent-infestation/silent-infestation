"use client";

import React, { useState, useRef, useEffect } from "react";
import Alert from "@/components/Alert/Alert";
import { TypeAnimation } from "react-type-animation";

const Contact = () => {
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef(null);

  const contactFields = [
    { name: "email", placeholder: "Votre Email", label: "Email", type: "email", required: true },
    { name: "subject", placeholder: "Sujet", label: "Sujet", type: "text", required: true },
    {
      name: "message",
      placeholder: "Votre message",
      label: "Message",
      type: "textarea",
      required: true,
    },
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/mailer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          type: "contact",
          email: data.email,
          sujet: data.subject,
          message: data.message,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: errorData || "Erreur lors de l'envoi du message.",
        });
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "Message envoyé avec succès !",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur lors de l'envoi du message.",
      });
    }

    e.target.reset();
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <>
      <Alert {...alert} onClose={() => setAlert({ ...alert, isShowingAlert: false })} />
      <div className="flex min-h-screen flex-col items-center gap-10 bg-[#DCF0FF] p-4 sm:p-20">
        <h1 className="text-center text-4xl font-bold text-[#05829E]">
          <TypeAnimation
            sequence={["Contactez-nous", 2000, "On est là pour vous", 2000]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </h1>

        <p className="max-w-3xl text-center text-gray-700">
          Vous avez des questions, des suggestions ou besoin d&apos;assistance ? Remplissez le
          formulaire ci-dessous, et notre équipe vous répondra rapidement.
        </p>

        <form
          ref={formRef}
          onSubmit={handleContactSubmit}
          className="w-full max-w-lg space-y-6 rounded-xl bg-white p-6 shadow-lg"
        >
          {contactFields.map(({ name, label, type, placeholder, required }) => (
            <div key={name} className="flex flex-col">
              <label htmlFor={name} className="mb-2 text-lg font-medium text-[#05829E]">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  id={name}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="rounded-lg border border-gray-300 p-3 transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#05829E]"
                  rows={4}
                />
              ) : (
                <input
                  type={type}
                  id={name}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="rounded-lg border border-gray-300 p-3 transition duration-300 focus:outline-none focus:ring-2 focus:ring-[#05829E]"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-[#05829E] py-3 text-lg font-semibold text-white transition duration-300 hover:bg-[#046b7b]"
          >
            Envoyer le message
          </button>
        </form>
      </div>
    </>
  );
};

export default Contact;
