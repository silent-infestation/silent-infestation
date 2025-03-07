'use client';

import { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    age: '',
    email: '',
    password: '',
    society: '',
  });
  const [message, setMessage] = useState('');

  // Gestion des changements dans les champs du formulaire
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Succès : ${data.message}`);
      } else {
        setMessage(`Erreur : ${data.message || 'Une erreur est survenue.'}`);
      }
    } catch (error) {
      console.error(error);
      setMessage('Impossible de contacter le serveur.');
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center text-[#00202B]">
      <h1 className="mb-6 text-2xl font-bold">Inscription</h1>
      <form onSubmit={handleSubmit} className="flex w-80 flex-col space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Nom"
          value={formData.name}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="text"
          name="surname"
          placeholder="Prénom"
          value={formData.surname}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="number"
          name="age"
          placeholder="Âge"
          value={formData.age}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="text"
          name="society"
          placeholder="Société"
          value={formData.society}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={handleChange}
          required
          className="rounded border border-gray-300 bg-[#f8f2e2] p-3 text-[#00202B] placeholder-[#00202B] shadow-xl"
        />
        <div className="my-4 flex items-center justify-center">
          <span className="text-2xl">↓</span>
        </div>
        <button
          type="submit"
          className="rounded bg-[#00202B] p-3 text-[#f8f2e2] shadow-xl transition hover:bg-[#003345]"
        >
          S&apos;inscrire
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
    </div>
  );
};

export default Register;
