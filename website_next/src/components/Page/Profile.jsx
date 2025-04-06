"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthProvider";
import { useAppContext } from "@/app/context/AppContext";
import Alert from "../Alert/Alert";
import api from "@/lib/api";

export default function Profile() {
  const { logout } = useAppContext();
  const { user: authUser, loading } = useAuth();
  const [alert, setAlert] = useState({
    isShowingAlert: false,
    isAlertErrorMessage: false,
    alertTitle: "",
  });

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  useEffect(() => {
    if (authUser) {
      const hydratedUser = {
        firstName: authUser.name || "",
        lastName: authUser.surname || "",
        email: authUser.email || "",
      };
      setUser(hydratedUser);
      setEditedUser(hydratedUser);
    }
  }, [authUser]);

  const handleEditChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setUser(editedUser);
    setIsEditing(false);

    await api
      .put("/user/me", {
        name: editedUser.firstName,
        surname: editedUser.lastName,
        email: editedUser.email,
      })
      .then((res) => {
        if (res.status === 200) {
          console.log("Profil mis à jour avec succès");
          setAlert({
            isShowingAlert: true,
            isAlertErrorMessage: false,
            alertTitle: "Profil mis à jour avec succès !",
          });
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

  if (loading) return <p className="mt-10 text-center">Chargement du profil...</p>;
  if (!authUser) return <p className="mt-10 text-center">Utilisateur non connecté.</p>;

  return (
    <>
      <Alert
        isShowingAlert={alert.isShowingAlert}
        isAlertErrorMessage={alert.isAlertErrorMessage}
        alertTitle={alert.alertTitle}
      />
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

            <button
              onClick={handleDeleteAccount}
              className="bg-red-500·hover:bg-red-600·rounded-md·px-4·py-2·text-white·transition"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
