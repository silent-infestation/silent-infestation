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
  const [trustedSites, setTrustedSites] = useState([]);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (!authUser) return;

    // Charger les sites depuis l'API /api/sites
    fetch("/api/sites", {
      headers: {
        Authorization: `Bearer ${authUser?.token}`,
      },
    })
      .then((res) => res.json())
      .then(async (data) => {
        setTrustedSites(data);
        console.log("Sites récupérés :", data);

        // Relancer la vérification pour les sites non vérifiés
        for (const site of data) {
          if (site.state === "unverified") {
            try {
              const res = await api.post(
                "/sites/verify",
                { siteId: site.id },
                { headers: { Authorization: `Bearer ${authUser.token}` } }
              );
              if ((res.status === 200 || res.ok) && res.data.verified) {
                setAlert({
                  isShowingAlert: true,
                  isAlertErrorMessage: false,
                  alertTitle: `Vérification réussie pour ${site.url}`,
                });
              }
              console.log(`Relance vérification pour ${site.url_site}`);
            } catch (err) {
              console.error("Erreur de relance vérification :", err);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des sites :", err);
        setAlert({
          isShowingAlert: true,
          isAlertErrorMessage: true,
          alertTitle: "Erreur lors de la récupération des URLs fiables.",
        });
      });
  }, [authUser]);

  // Hydrater le profil de l'utilisateur
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

  // Fonction de validation de l'URL
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  const handleAddUrl = async () => {
    if (!newUrl.trim()) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "Veuillez saisir une URL valide. Par exemple : http://www.exemple.com",
      });
      return;
    }
    if (!isValidUrl(newUrl)) {
      setAlert({
        isShowingAlert: true,
        isAlertErrorMessage: true,
        alertTitle: "L'URL saisie est invalide, exemple : https://www.exemple.com",
      });
      return;
    }

    try {
      const siteRes = await api.post(
        "/sites",
        { url: newUrl, userId: authUser.id },
        { headers: { Authorization: `Bearer ${authUser.token}` } }
      );

      if (siteRes.status === 200 || siteRes.ok || siteRes.status === 201) {
        const site = siteRes.data;
        setTrustedSites((prev) => [...prev, site]);
        if (siteRes.status === 200 || siteRes.ok || siteRes.status === 201) {
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: false,
            alertTitle: "URL ajoutée avec succès.",
          });
        } else {
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: true,
            alertTitle: siteRes.message || "Erreur lors de l'ajout de l'URL.",
          });
        }
        const res = await api.post(
          "/mailer",
          {
            type: "security",
            url: newUrl,
            destinataire: authUser.email,
            siteId: site.id,
          },
          {
            headers: { Authorization: `Bearer ${authUser.token}` },
          }
        );
        setTimeout(() => {
          if (res.status === 200 || res.ok) {
            setAlert({
              isShowingAlert: true,
              isAlertErrorMessage: false,
              alertTitle: res.message || "Email de sécurité envoyé.",
            });
          }
        }, 500);
      } else {
        setTimeout(() => {
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: true,
            alertTitle: siteRes.message || "Erreur lors de l'ajout de l'URL.",
          });
        }, 500);
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

  const handleDeleteUrl = async (siteIdToDelete) => {
    console.log("Suppression du site avec ID :", siteIdToDelete);
    try {
      const res = await api.del(`/sites?siteId=${siteIdToDelete}`);
      if (res.status === 200 || res.ok) {
        // Mise à jour du state pour supprimer le site localement
        setTrustedSites((prev) => prev.filter((site) => site.id !== siteIdToDelete));
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
              placeholder="Ajouter une URL fiable (ex: https://www.exemple.com)"
              required
              className="flex-1 rounded-md border p-3 focus:border-[#05829E] focus:ring-[#05829E]"
            />
            <button
              onClick={handleAddUrl}
              className="rounded-md bg-[#05829E] px-5 py-3 text-white transition hover:bg-[#026A72]"
            >
              Ajouter
            </button>
          </div>

          {trustedSites?.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between rounded-md border bg-gray-50 px-4 py-2"
            >
              <div className="flex items-center gap-2">
                {site.state !== "verified" && (
                  <svg
                    className="h-4 w-4 animate-spin text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                )}
                <span className="break-all text-sm text-[#00202B]">{site.url}</span>
              </div>
              <button
                onClick={() => handleDeleteUrl(site.id)}
                className="hover:text-red-700 text-sm text-red-500"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
