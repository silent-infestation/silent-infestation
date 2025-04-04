"use client";

import { useState } from "react";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "@/components/Alert/Alert";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { login } = useAppContext();
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        login();
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: data.message || "Erreur lors de la connexion",
        });
      }
    } catch (error) {
      console.error(error);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur lors de la connexion",
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
      <div className="flex h-screen flex-col items-center justify-center text-[#00202B]">
        <h1 className="mb-6 text-2xl font-bold">Connexion</h1>
        <form onSubmit={handleSubmit} className="flex w-80 flex-col space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
            required
          />
          <button
            type="submit"
            className="rounded bg-[#00202B] p-3 text-[#f8f2e2] shadow-xl transition hover:bg-[#003345]"
          >
            Se connecter
          </button>
        </form>
        <button className="mt-4 rounded bg-blue-500 p-3 text-white shadow-xl transition hover:bg-blue-600">
          Se connecter avec Google
        </button>
      </div>
    </>
  );
};

export default Login;
