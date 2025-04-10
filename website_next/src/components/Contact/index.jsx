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
    { name: "message", placeholder: "Votre message", label: "Message", type: "textarea", required: true },
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(formRef.current);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "Message envoyé avec succès !",
        });
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: result.error || "Erreur lors de l'envoi du message.",
        });
      }
    } catch (error) {
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
      <div className="flex flex-col items-center gap-10 p-4 sm:p-20 bg-[#DCF0FF] min-h-screen">
        <h1 className="text-4xl font-bold text-center text-[#05829E]">
          <TypeAnimation
            sequence={["Contactez-nous", 2000, "On est là pour vous", 2000]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
          />
        </h1>

        <p className="max-w-3xl text-center text-gray-700">
          Vous avez des questions, des suggestions ou besoin d'assistance ? Remplissez le formulaire ci-dessous, et notre équipe vous répondra rapidement.
        </p>

        <form ref={formRef} onSubmit={handleContactSubmit} className="w-full max-w-lg space-y-6 bg-white p-6 rounded-xl shadow-lg">
          {contactFields.map(({ name, label, type, placeholder, required }) => (
            <div key={name} className="flex flex-col">
              <label htmlFor={name} className="text-lg font-medium text-[#05829E] mb-2">{label}</label>
              {type === "textarea" ? (
                <textarea
                  id={name}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05829E] transition duration-300"
                  rows={4}
                />
              ) : (
                <input
                  type={type}
                  id={name}
                  name={name}
                  placeholder={placeholder}
                  required={required}
                  className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#05829E] transition duration-300"
                />
              )}
            </div>
          ))}

          <button type="submit" className="w-full py-3 mt-6 bg-[#05829E] text-white text-lg font-semibold rounded-lg hover:bg-[#046b7b] transition duration-300">
            Envoyer le message
          </button>
        </form>
      </div>
    </>
  );
};

export default Contact;
