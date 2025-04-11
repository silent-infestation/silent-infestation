"use client";

import { useState } from "react";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "@/components/Alert/Alert";
import { useAuth } from "@/app/context/AuthProvider";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { refreshUser } = useAuth();
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
        await refreshUser();
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
        <form onSubmit={handleSubmit} className="flex w-80 flex-col space-y-6">
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
          <div className="flex justify-center">
            <span className="text-2xl">↓</span>
          </div>
          <button
            type="submit"
            className="rounded bg-[#00202B] p-3 text-[#f8f2e2] shadow-xl transition hover:bg-[#003345]"
          >
            Se connecter
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;
