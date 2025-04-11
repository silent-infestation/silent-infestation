"use client";

import { useState } from "react";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "@/components/Alert/Alert";
import { useAuth } from "@/app/context/AuthProvider";

const Register = () => {
  const { login } = useAppContext();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    age: "",
    email: "",
    password: "",
    society: "",
  });
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login();
        await refreshUser();
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: data.message || "Une erreur est survenue.",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Impossible de contacter le serveur.",
      });
    }
  };

  return (
    <>
      <Alert
        isShowingAlert={alert.isShowingAlert}
        isAlertErrorMessage={alert.isAlertErrorMessage}
        alertTitle={alert.alertTitle}
        onClose={() => setAlert({ ...alert, isShowingAlert: false })}
      />
      <div className="flex flex-col items-center justify-center text-[#00202B]">
        <form onSubmit={handleSubmit} className="flex w-80 flex-col space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Nom"
            value={formData.name}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <input
            type="text"
            name="surname"
            placeholder="Prénom"
            value={formData.surname}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <input
            type="number"
            name="age"
            placeholder="Âge"
            value={formData.age}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <input
            type="text"
            name="society"
            placeholder="Société"
            value={formData.society}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            required
            className="rounded border border-gray-300 bg-[#ffff] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
          <div className="my-4 flex items-center justify-center">
            <span className="text-2xl">↓</span>
          </div>
          <button
            type="submit"
            className="rounded bg-[#00202B] p-3 text-[#ffff] shadow-xl transition hover:bg-[#003345]"
          >
            S&apos;inscrire
          </button>
        </form>
      </div>
    </>
  );
};

export default Register;
