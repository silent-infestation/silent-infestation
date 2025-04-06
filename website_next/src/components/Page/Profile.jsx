"use client";

import React, { useState } from "react";

export default function Profile() {
  const [user, setUser] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
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
    <div className="flex min-h-screen items-center justify-center bg-[#DCF0FF] p-6">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold text-[#00202B]">
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
              className="mt-1 w-full rounded-md border p-2 focus:border-[#05829E] focus:ring-[#05829E] disabled:bg-gray-100"
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
              className="mt-1 w-full rounded-md border p-2 focus:border-[#05829E] focus:ring-[#05829E] disabled:bg-gray-100"
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
              className="mt-1 w-full rounded-md border p-2 focus:border-[#05829E] focus:ring-[#05829E] disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="rounded-md bg-[#05829E] px-4 py-2 text-white transition hover:bg-[#026A72]"
            >
              Enregistrer
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
            >
              Modifier
            </button>
          )}

          <button className="rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600">
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
