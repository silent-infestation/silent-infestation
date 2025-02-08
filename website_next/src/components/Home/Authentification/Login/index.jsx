"use client";

import { useState } from "react";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      // Redirection vers le tableau de bord
      router.push("/dashboard");
    } else {
      setMessage(data.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#DCF0FF] text-[#00202B]">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-80 space-y-4"
      >
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirmer le mot de passe"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <div className="flex justify-center items-center my-4">
          <span className="text-2xl">↓</span>
        </div>
        <button
          type="submit"
          className="p-3 bg-[#00202B] text-[#f8f2e2] rounded hover:bg-[#003345] transition shadow-xl"
        >
          Se connecter
        </button>
      </form>
      <button
        className="mt-4 p-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition shadow-xl"
      >
        Se connecter avec Google
      </button>
      {message && (
        <p className="mt-4 text-red-500 text-sm">{message}</p>
      )}
    </div>
  );
};

export default Login;
