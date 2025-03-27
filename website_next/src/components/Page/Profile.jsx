'use client';

import React, { useState } from 'react';

export default function Profile() {
  const [user, setUser] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleEditChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setUser(editedUser);
    setIsEditing(false);
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
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
