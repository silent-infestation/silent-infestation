"use client";

import React, { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import api from "@/lib/api";
import { useAuth } from "@/app/context/AuthProvider";

export default function Header() {
  const [showPopup, setShowPopup] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [popupStep, setPopupStep] = useState(null);
  const [selectedUrl, setSelectedUrl] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const router = useRouter();
  const { changeActivePage } = useAppContext();
  const [trustedSites, setTrustedSites] = useState([]);
  const { user: authUser, loading } = useAuth();

  const user = {
    isAuthenticated: true,
    trustedUrls: ["https://pentest-ground.com:4280"],
  };

  const [progress, setProgress] = useState(0);
  const pollingInterval = 3000;

  const startScan = async () => {
    if (!selectedUrl) return;

    try {
      const response = await api.post("/scan/start", { startUrl: selectedUrl });
      const newScanId = response.data.scanId;
      if (!newScanId) {
        throw new Error("Scan ID manquant dans la réponse !");
      }
      setScanId(newScanId);
      setPopupStep("loading");
      setProgress(0);
      simulateProgress();
      pollScanStatus();
    } catch (error) {
      console.error("Erreur au démarrage du scan", error);
    }
  };

  // Simule la progression du scan
  const simulateProgress = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += 2 + Math.random() * 3;
      if (current >= 90) {
        clearInterval(interval);
        return;
      }
      setProgress(current);
    }, 500);
  };

  // Vérifie le statut du scan
  const pollScanStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await api.get("/scan/status");
        if (response.data.status === "success") {
          clearInterval(interval);
          setProgress(100);

          setTimeout(() => {
            setShowDownload(true);
            setPopupStep("done");
          }, 2500);
        }
      } catch (error) {
        console.error("Erreur polling:", error);
      }
    }, 3000);
  };
  console.log("Utilisateur authentifié :", authUser);

  useEffect(() => {
    // Charger les sites depuis l'API /api/sites
    fetch("/api/sites", {
      headers: {
        Authorization: `Bearer ${authUser?.token}`,
      },
    })
      .then((res) => res.json())
      .then(async (data) => {
        const sites = Array.isArray(data) ? data : [];
        setTrustedSites(sites);

        console.log("Sites récupérés :", sites);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des sites :", error);
      });
  }, []);

  const handleScanClick = () => {
    if (!user.isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!user.trustedUrls || user.trustedUrls.length === 0) {
      setPopupStep("no-url");
    } else {
      setPopupStep("select");
    }

    setShowPopup(true);
  };

  const handleGoToProfile = () => {
    changeActivePage("profile");
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupStep(undefined);
    setSelectedUrl(null);
    setShowDownload(false);
  };

  return (
    <header className="relative flex h-screen items-center justify-center text-center text-[#05829E]">
      <div className="max-w-2xl p-10">
        <h1 className="mb-10 text-5xl font-bold">
          <span className="block text-[#00202B]">Bienvenue sur</span>
          <TypeAnimation
            sequence={[
              "notre plateforme sécurisée",
              2000,
              "un espace innovant",
              2000,
              "votre outil de confiance",
              2000,
              "un service de qualité",
              2000,
            ]}
            wrapper="span"
            speed={50}
            repeat={Infinity}
            className="mt-2 block whitespace-nowrap"
          />
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Scannez votre site en un clic et obtenez des analyses détaillées sur sa sécurité !
        </p>

        {/* ESPACEMENT POUR LE BOUTON */}
        <div className="relative mt-32 flex items-center justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-[#05829E]"
              style={{
                width: "120px",
                height: "120px",
              }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 2.8 }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                repeatDelay: 2,
                delay: i * 1,
              }}
            />
          ))}

          {/* BOUTON */}
          <motion.button
            onClick={handleScanClick}
            className="relative rounded-xl bg-[#05829E] px-10 py-4 text-2xl font-semibold text-white shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ scale: [1, 1.03, 1] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.span
              animate={{ opacity: [1, 0.7, 1], scale: [1, 1.05, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Scanner un site
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* POPUP CENTRÉE */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-lg">
            {/* PAS D'URL */}
            {popupStep === "no-url" && (
              <>
                <p className="mb-4 text-gray-800">
                  Vous n&rsquo;avez pas encore d&rsquo;URL fiable enregistrée.
                </p>
                <button
                  onClick={handleGoToProfile}
                  className="rounded bg-[#05829E] px-4 py-2 text-white hover:bg-[#046e87]"
                >
                  Ajouter une URL dans mon profil
                </button>
              </>
            )}

            {/* SÉLECTION D’URL */}
            {popupStep === "select" && (
              <>
                <p className="mb-4 font-medium text-gray-700">Sélectionnez une URL à scanner :</p>
                <div className="mb-4 flex flex-col items-start space-y-2">
                  {trustedSites?.map(
                    (url) =>
                      url.state === "verified" && (
                        <button
                          key={url.id}
                          onClick={() => setSelectedUrl(url.url)}
                          className={`w-full rounded px-4 py-2 text-left transition ${
                            selectedUrl === url
                              ? "bg-[#05829E] text-white"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {url.url}
                        </button>
                      )
                  )}
                </div>
                <button
                  disabled={!selectedUrl}
                  onClick={startScan}
                  className={`mt-2 rounded px-4 py-2 text-white ${
                    selectedUrl
                      ? "bg-[#05829E] hover:bg-[#046e87]"
                      : "cursor-not-allowed bg-gray-400"
                  }`}
                >
                  Lancer le scan
                </button>
              </>
            )}

            {/* LOADING */}
            {popupStep === "loading" && (
              <>
                <p className="mb-4 text-gray-800">Analyse de l&rsquo;URL en cours...</p>
                <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                  <motion.div
                    className="h-full bg-[#05829E]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: pollingInterval / 1000 }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">{progress.toFixed(2)}%</p>
              </>
            )}

            {/* FIN DU SCAN */}
            {popupStep === "done" && showDownload && (
              <>
                <p className="mb-4 text-gray-800">
                  Analyse terminée pour : <strong>{selectedUrl}</strong>
                </p>
                <button
                  onClick={async () => {
                    try {
                      const blob = await api.get(`/downloadReport/${scanId}`, {
                        responseType: "blob",
                      });
                      const url = URL.createObjectURL(blob);

                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", `security-rapport-${scanId}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("Erreur téléchargement rapport :", err);
                      alert("Impossible de télécharger le rapport.");
                    }
                  }}
                  className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Télécharger le rapport
                </button>
              </>
            )}

            {/* Fermer */}
            <button
              onClick={handleClosePopup}
              className="mt-4 block w-full text-sm text-gray-500 hover:underline"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
