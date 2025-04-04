"use client";

import React, { useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle, Search, Download } from "lucide-react";
import jsPDF from "jspdf";

const tests = [
  { id: 1, date: "2025-04-03", site: "example.com", status: "safe" },
  { id: 2, date: "2025-04-02", site: "testsite.org", status: "warning" },
  { id: 3, date: "2025-04-01", site: "securitytest.net", status: "danger" },
];

export default function Historique() {
  const [search, setSearch] = useState("");

  const filteredTests = tests.filter((test) =>
    test.site.toLowerCase().includes(search.toLowerCase())
  );

  const generatePDF = (test) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Rapport de Sécurité", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text(`Site analysé : ${test.site}`, 20, 40);
    doc.text(`Date du test : ${test.date}`, 20, 50);

    let statusText = "";
    let statusColor = "";

    switch (test.status) {
      case "safe":
        statusText = "Aucune vulnérabilité détectée ✅";
        statusColor = "green";
        break;
      case "warning":
        statusText = "Quelques failles modérées ⚠️";
        statusColor = "orange";
        break;
      case "danger":
        statusText = "Failles critiques détectées ❌";
        statusColor = "red";
        break;
    }

    doc.setTextColor(statusColor);
    doc.text(`Statut : ${statusText}`, 20, 60);
    doc.setTextColor("black");

    doc.save(`Rapport_${test.site}.pdf`);
  };

  return (
    <section className="min-h-screen p-10 text-[#00202B] bg-[#DCF0FF]">
      {/* Titre animé */}
      <h1 className="mb-8 text-4xl font-bold text-center">
        <TypeAnimation
          sequence={["Historique des scans", 2000, "Vérifiez vos analyses", 2000]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          className="block text-[#05829E]"
        />
      </h1>

      {/* Barre de recherche */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un site..."
            className="w-80 p-3 pl-10 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#05829E]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {/* Timeline des tests */}
      <div className="max-w-3xl mx-auto space-y-6">
        {filteredTests.length > 0 ? (
          filteredTests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="p-5 bg-white rounded-lg shadow-md border-l-4"
              style={{
                borderColor:
                  test.status === "safe"
                    ? "#10B981"
                    : test.status === "warning"
                    ? "#F59E0B"
                    : "#EF4444",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{test.site}</h3>
                <span className="text-gray-500">{test.date}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                {test.status === "safe" && (
                  <>
                    <CheckCircle className="text-[#10B981]" />
                    <span className="text-green-600">Aucune vulnérabilité détectée</span>
                  </>
                )}
                {test.status === "warning" && (
                  <>
                    <AlertTriangle className="text-[#F59E0B]" />
                    <span className="text-yellow-600">Quelques failles modérées</span>
                  </>
                )}
                {test.status === "danger" && (
                  <>
                    <XCircle className="text-[#EF4444]" />
                    <span className="text-red-600">Failles critiques détectées</span>
                  </>
                )}
              </div>

              {/* Bouton de téléchargement */}
              <button
                className="mt-4 flex items-center gap-2 px-4 py-2 text-white bg-[#05829E] rounded-lg shadow hover:bg-[#04657B] transition"
                onClick={() => generatePDF(test)}
              >
                <Download size={18} />
                Télécharger le rapport
              </button>
            </motion.div>
          ))
        ) : (
          <p className="text-center text-gray-500">Aucun test trouvé.</p>
        )}
      </div>
    </section>
  );
}
