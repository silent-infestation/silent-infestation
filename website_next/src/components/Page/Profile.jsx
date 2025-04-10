'use client';

import React, { useState, useEffect } from 'react';

export default function Profile() {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [trustedUrls, setTrustedUrls] = useState([]);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    // Charger les infos de l'utilisateur depuis l'API
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setEditedUser(data);
      });

    // Charger les URLs fiables depuis l'API (si disponible)
    fetch('/api/trusted-urls')
      .then((res) => res.json())
      .then((data) => {
        setTrustedUrls(data);
      });
  }, []);

  const handleEditChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const response = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedUser),
    });
    if (response.ok) {
      setUser(editedUser);
      setIsEditing(false);
    } else {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      const response = await fetch('/api/user', {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Compte supprimé avec succès.');
        window.location.href = '/'; // Redirection après suppression
      } else {
        alert('Erreur lors de la suppression du compte');
      }
    }
  };

  const handleAddUrl = async () => {
    if (newUrl.trim() === '') {
      alert('L\'URL ne peut pas être vide.');
      return;
    }

    const response = await fetch('/api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url_site: newUrl,
        auth_email: user.email // Utilisez l'email de l'utilisateur connecté
      }),
    });

    if (response.ok) {
      const addedUrl = await response.json();
      setTrustedUrls([...trustedUrls, addedUrl]);
      setNewUrl('');
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleDeleteUrl = async (url) => {
    const response = await fetch('/api/trusted-urls', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (response.ok) {
      setTrustedUrls(trustedUrls.filter((item) => item !== url));
    } else {
      alert('Erreur lors de la suppression de l\'URL.');
    }
  };

  return (
    <div className="min-h-screen bg-[#DCF0FF] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte Profil */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-[#00202B] text-center mb-6">
            Mon <span className="text-[#05829E]">Profil</span>
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={editedUser.firstName}
                onChange={handleEditChange}
                disabled={!isEditing}
                className="w-full mt-1 p-2 border rounded-md focus:ring-[#05829E] focus:border-[#05829E] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                type="text"
                name="lastName"
                value={editedUser.lastName}
                onChange={handleEditChange}
                disabled={!isEditing}
                className="w-full mt-1 p-2 border rounded-md focus:ring-[#05829E] focus:border-[#05829E] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={editedUser.email}
                onChange={handleEditChange}
                disabled={!isEditing}
                className="w-full mt-1 p-2 border rounded-md focus:ring-[#05829E] focus:border-[#05829E] disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#05829E] text-white rounded-md hover:bg-[#026A72] transition"
              >
                Enregistrer
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Modifier
              </button>
            )}

            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>

        {/* Carte des URLs Fiables */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-[#00202B] mb-6">URLs Fiables</h2>

          <div className="mb-4 flex">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Ajouter une URL fiable"
              className="w-full p-2 border rounded-md focus:ring-[#05829E] focus:border-[#05829E]"
            />
            <button
              onClick={handleAddUrl}
              className="ml-4 px-4 py-2 bg-[#05829E] text-white rounded-md hover:bg-[#026A72] transition"
            >
              Ajouter
            </button>
          </div>

          <div className="space-y-2">
            {trustedUrls.map((url) => (
              <div key={url} className="flex justify-between items-center">
                <span>{url}</span>
                <button
                  onClick={() => handleDeleteUrl(url)}
                  className="text-red-500 hover:text-red-700"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
