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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      <form onSubmit={handleSubmit} className="flex flex-col w-80 space-y-4">
        {['name','surname','age','society','email','password'].map((field) => (
          <input
            key={field}
            type={field === 'email' ? 'email' : field === 'password' ? 'password' : 'text'}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleChange}
            required
            className="p-3 rounded border border-gray-300 bg-[#f8f2e2] text-[#00202B] placeholder-[#00202B] shadow-xl"
          />
        ))}
        <button type="submit" className="p-3 bg-[#00202B] text-[#f8f2e2] rounded hover:bg-[#003345] transition shadow-xl">
          S'inscrire
        </button>
      </form>
      {message && <p className="mt-4 text-red-500 text-sm">{message}</p>}
    </div>
  );
};

export default Register;
