"use client";

import React, { useState, useEffect } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Search, Download } from "lucide-react";

export default function Historique() {
  const [search, setSearch] = useState("");
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalScans, setTotalScans] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchScans = async (pageToFetch = 1) => {
    try {
      const res = await fetch(`/api/scan?page=${pageToFetch}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (pageToFetch === 1) {
        setScans(data.scans || []);
      } else {
        setScans((prev) => [...prev, ...(data.scans || [])]);
      }

      setTotalScans(data.total || 0);
    } catch (err) {
      console.error("Erreur lors du chargement des scans :", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchScans(1).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    await fetchScans(nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const filteredScans = scans.filter((scan) =>
    scan.url.toLowerCase().includes(search.toLowerCase())
  );

  const formatScanDate = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const time = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Aujourd'hui à ${time}`;
    }

    const formattedDate = date.toLocaleDateString("fr-FR");

    return `${formattedDate} à ${time}`;
  };

  return (
    <section className="min-h-screen bg-[#DCF0FF] p-10 text-[#00202B]">
      <h1 className="mb-8 text-center text-4xl font-bold">
        <TypeAnimation
          sequence={["Historique des scans", 2000, "Vérifiez vos analyses", 2000]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          className="block text-[#05829E]"
        />
      </h1>

      <div className="mb-6 flex justify-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un site..."
            className="w-80 rounded-lg border border-gray-300 bg-white p-3 pl-10 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#05829E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        {loading ? (
          <p className="text-center text-gray-500">Chargement des scans...</p>
        ) : filteredScans.length > 0 ? (
          filteredScans.map((scan, index) => (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="rounded-lg border-l-4 bg-white p-5 shadow-md"
              style={{
                borderColor:
                  scan.status === "safe"
                    ? "#10B981"
                    : scan.status === "warning"
                      ? "#F59E0B"
                      : "#EF4444",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{scan.url}</h3>
                <span className="text-gray-500">{formatScanDate(scan.scannedAt)}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                {scan.status === "safe" && (
                  <>
                    <CheckCircle className="text-[#10B981]" />
                    <span className="text-green-600">Aucune vulnérabilité détectée</span>
                  </>
                )}
                {scan.status === "warning" && (
                  <>
                    <AlertTriangle className="text-[#F59E0B]" />
                    <span className="text-yellow-600">Quelques failles modérées</span>
                  </>
                )}
                {scan.status === "danger" && (
                  <>
                    <XCircle className="text-[#EF4444]" />
                    <span className="text-red-600">Failles critiques détectées</span>
                  </>
                )}
              </div>

              <button
                className="mt-4 flex items-center gap-2 rounded-lg bg-[#05829E] px-4 py-2 text-white shadow transition hover:bg-[#04657B]"
                onClick={async () => {
                  try {
                    const blob = await fetch(`/api/downloadReport/${scan.id}`, {
                      method: "GET",
                      headers: {
                        "Content-Type": "application/pdf",
                      },
                    }).then((res) => res.blob());
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `security-rapport-${scan.id}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("Erreur téléchargement rapport :", err);
                    alert("Impossible de télécharger le rapport.");
                  }
                }}
              >
                <Download size={18} />
                Télécharger le rapport
              </button>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-gray-500">Aucun scan trouvé.</p>
        )}
      </div>

      {!loading && scans.length < totalScans && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleLoadMore}
            className="rounded-lg bg-[#05829E] px-6 py-2 text-white shadow hover:bg-[#04657B] disabled:opacity-50"
            disabled={loadingMore}
          >
            {loadingMore ? "Chargement..." : "Charger plus"}
          </button>
        </div>
      )}
    </section>
  );
}
