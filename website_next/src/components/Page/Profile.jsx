"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthProvider";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "../Alert/Alert";
import api from "@/lib/api";

export default function Profile() {
  const { logout } = useAppContext();
  const { user: authUser, loading } = useAuth();
  const { refreshUser } = useAuth();
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
  const [trustedUrls, setTrustedUrls] = useState([]);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (authUser) {
      setEditedUser({
        firstName: authUser.name,
        lastName: authUser.surname,
        email: authUser.email,
      });
    }
  }, [authUser]);

  // useEffect(() => {
  // Charger les URLs fiables depuis l'API (si disponible)
  // fetch("/api/trusted-urls")
  //   .then(async (res) => {
  //     if (!res.ok) {
  //       const text = await res.text();
  //       throw new Error(`Erreur API trusted-urls: ${text}`);
  //     }
  //     return res.json();
  //   })
  //   .then((data) => {
  //     setTrustedUrls(data.urls || []);
  //   })
  //   .catch((err) => {
  //     console.error("Erreur lors du chargement des URLs fiables :", err);
  //   });
  // }, []);

  const handleEditChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsEditing(false);

    await api
      .put("/user/me", {
        name: editedUser.firstName,
        surname: editedUser.lastName,
        email: editedUser.email,
      })
      .then(async (res) => {
        if (res.status === 200) {
          console.log("Profil mis à jour avec succès");
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: false,
            alertTitle: "Profil mis à jour avec succès !",
          });
          // Mettre à jour le contexte utilisateur
          await refreshUser();
        } else {
          console.log("Erreur lors de la mise à jour du profil");
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: true,
            alertTitle: res.message || "Erreur lors de la mise à jour du profil.",
          });
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la mise à jour du profil :", err);
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: "Erreur lors de la mise à jour du profil.",
        });
      });
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Es-tu sûr de vouloir supprimer ton compte ? Cette action est irréversible."
    );

    if (!confirm) return;

    try {
      const res = await api.del("/user/me");

      if (res.ok) {
        await logout();
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "Compte supprimé avec succès.",
        });
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: res.data.message || "Erreur lors de la suppression du compte.",
        });
      }
    } catch (err) {
      console.error("Erreur suppression compte :", err);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur inattendue lors de la suppression du compte.",
      });
    }
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;

    try {
      const res = await api.post("/trusted-urls", { url: newUrl });
      if (res.status === 200 || res.ok) {
        setTrustedUrls((prev) => [...prev, newUrl]);
        setNewUrl("");
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "URL ajoutée avec succès.",
        });
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: res.message || "Erreur lors de l'ajout de l'URL.",
        });
      }
    } catch (err) {
      console.error("Erreur ajout URL :", err);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur inattendue lors de l'ajout de l'URL.",
      });
    }
  };

  const handleDeleteUrl = async (urlToDelete) => {
    try {
      const res = await api.delete("/trusted-urls", { data: { url: urlToDelete } });
      if (res.status === 200 || res.ok) {
        setTrustedUrls((prev) => prev.filter((url) => url !== urlToDelete));
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: false,
          alertTitle: "URL supprimée avec succès.",
        });
      } else {
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: res.message || "Erreur lors de la suppression de l'URL.",
        });
      }
    } catch (err) {
      console.error("Erreur suppression URL :", err);
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Erreur inattendue lors de la suppression de l'URL.",
      });
    }
  };

  if (loading) return <p className="mt-10 text-center">Chargement du profil...</p>;
  if (!authUser) return <p className="mt-10 text-center">Utilisateur non connecté.</p>;

  return (
    <>
      <Alert
        isShowingAlert={alert.isShowingAlert}
        isAlertErrorMessage={alert.isAlertErrorMessage}
        alertTitle={alert.alertTitle}
        onClose={() => setAlert({ ...alert, isShowingAlert: false })}
      />
      <div className="flex min-h-screen flex-col items-start justify-center gap-10 bg-[#DCF0FF] p-6 lg:flex-row">
        {/* Profil */}
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

            <button
              onClick={handleDeleteAccount}
              className="rounded-md bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>

        {/* Carte des URLs Fiables */}
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h2 className="mb-6 text-2xl font-bold text-[#00202B]">URLs Fiables</h2>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Ajouter une URL fiable"
              className="flex-1 rounded-md border p-3 focus:border-[#05829E] focus:ring-[#05829E]"
            />
            <button
              onClick={handleAddUrl}
              className="rounded-md bg-[#05829E] px-5 py-3 text-white transition hover:bg-[#026A72]"
            >
              Ajouter
            </button>
          </div>

          {trustedUrls.length === 0 ? (
            <p className="italic text-gray-500">Aucune URL ajoutée pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {trustedUrls.map((url) => (
                <div
                  key={url}
                  className="flex items-center justify-between rounded-md border bg-gray-50 px-4 py-2"
                >
                  <span className="break-all text-sm text-[#00202B]">{url}</span>
                  <button
                    onClick={() => handleDeleteUrl(url)}
                    className="hover:text-red-700 text-sm text-red-500"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
