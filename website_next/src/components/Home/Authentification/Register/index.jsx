"use client";

import { useState } from "react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    age: "",
    email: "",
    password: "",
    society: "",
  });
  const [message, setMessage] = useState("");

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
        setMessage(`Succès : ${data.message}`);
      } else {
        setMessage(`Erreur : ${data.message}`);
      }
    } catch (error) {
      setMessage("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#DCF0FF] text-[#00202B]">
      <h1 className="text-2xl font-bold mb-6">Inscription</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-80 space-y-4"
      >
        <input
          type="text"
          name="name"
          placeholder="Nom"
          value={formData.name}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="text"
          name="surname"
          placeholder="Prénom"
          value={formData.surname}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="number"
          name="age"
          placeholder="Âge"
          value={formData.age}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="text"
          name="society"
          placeholder="Société"
          value={formData.society}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          required
          className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <div className="flex justify-center items-center my-4">
          <span className="text-2xl">↓</span>
        </div>
        <button
          type="submit"
          className="p-3 bg-[#00202B] text-[#f8f2e2] rounded hover:bg-[#003345] transition shadow-xl"
        >
          S'inscrire
        </button>
      </form>
      {message && (
        <p className="mt-4 text-red-500 text-sm">{message}</p>
      )}
    </div>
  );
};

export default Register;
