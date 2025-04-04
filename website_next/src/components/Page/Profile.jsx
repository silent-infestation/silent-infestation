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

  useEffect(() => {
    // Charger les infos de l'utilisateur depuis l'API
    fetch('/api/user')
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setEditedUser(data);
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

  return (
    <div className="min-h-screen bg-[#DCF0FF] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-8">
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
    </div>
  );
}
