'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import du router

const Login = () => {
  const router = useRouter(); // Initialisation du router
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/'); // Redirection après succès
      } else {
        setMessage(data.message || 'Erreur lors de la connexion');
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#DCF0FF] text-[#00202B]">
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
      {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
    </div>
  );
};

export default Login;
