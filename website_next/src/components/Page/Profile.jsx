// ✅ Profile.jsx corrigé - gestion propre du POST et ajout site
"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthProvider";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "../Alert/Alert";

export default function Profile() {
  const { logout } = useAppContext();
  const { user: authUser, loading, refreshUser } = useAuth();
  const [editedUser, setEditedUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [trustedSites, setTrustedSites] = useState([]);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (!authUser) return;

    fetch("/api/sites", {
      headers: { Authorization: `Bearer ${authUser?.token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTrustedSites(data);
        }
      })
      .catch(() => {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: "Erreur lors de la récupération des URLs fiables.",
        });
      });
  }, [authUser]);

  useEffect(() => {
    if (authUser) {
      setEditedUser({
        firstName: authUser.name,
        lastName: authUser.surname,
        email: authUser.email,
      });
    }
  }, [authUser]);

  const handleEditChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const res = await fetch("/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedUser.firstName,
          surname: editedUser.lastName,
          email: editedUser.email,
        }),
      });
      if (res.ok) {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "Profil mis à jour avec succès !",
        });
        await refreshUser();
      } else {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (err) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur lors de la mise à jour du profil.",
      });
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;
    try {
      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authUser.token}`,
        },
        body: JSON.stringify({ url: newUrl, userId: authUser.id }),
      });
      const site = await siteRes.json();
      if (site?.url) {
        setTrustedSites((prev) => [...prev, site]);
      }
    } catch (err) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur inattendue lors de l'ajout de l'URL.",
      });
    }
  };

  const handleDeleteUrl = async (siteIdToDelete) => {
    try {
      const res = await fetch(`/api/sites/${siteIdToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setTrustedSites((prev) => prev.filter((site) => site.id !== siteIdToDelete));
      }
    } catch (err) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur inattendue lors de la suppression de l'URL.",
      });
    }
  };

  if (loading) return <p>Chargement du profil...</p>;
  if (!authUser) return <p>Utilisateur non connecté.</p>;

  return (
    <>
      <Alert {...alert} onClose={() => setAlert({ ...alert, isShowingAlert: false })} />
      <div>
        <h1>Profil</h1>
        <input
          name="firstName"
          value={editedUser.firstName}
          onChange={handleEditChange}
          disabled={!isEditing}
        />
        <input
          name="lastName"
          value={editedUser.lastName}
          onChange={handleEditChange}
          disabled={!isEditing}
        />
        <input
          name="email"
          value={editedUser.email}
          onChange={handleEditChange}
          disabled={!isEditing}
        />
        {isEditing ? (
          <button onClick={handleSave}>Enregistrer</button>
        ) : (
          <button onClick={() => setIsEditing(true)}>Modifier</button>
        )}
        <div>
          <input
            placeholder="Ajouter une URL fiable"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
          />
          <button onClick={handleAddUrl}>Ajouter</button>
          {trustedSites?.map((site) => (
            <div key={site.id}>
              <span>{site.url}</span>
              <button onClick={() => handleDeleteUrl(site.id)}>Supprimer</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
