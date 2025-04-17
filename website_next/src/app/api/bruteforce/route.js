import { NextResponse } from "next/server";
import { startBruteforceTesting, generateSummaryReport } from "./core";

/**
 * Route API pour lancer les tests depuis une application Next.js
 * Accessible via une requête POST avec l'URL de départ
 *
 * @param {Object} req - Requête HTTP
 * @returns {NextResponse} Réponse HTTP avec les résultats des tests
 */
export async function POST(req) {
  const { startUrl } = await req.json();
  if (!startUrl) {
    console.error("startUrl is required but missing.");
    return NextResponse.json({ error: "startUrl is required" }, { status: 400 });
  }

  console.info(`Received bruteforce testing request with startUrl: ${startUrl}`);

  try {
    // Lancer les tests et générer le rapport
    const bruteforceResults = await startBruteforceTesting(startUrl);
    const summaryReport = generateSummaryReport(bruteforceResults);

    console.info("Bruteforce testing complete.");
    return NextResponse.json({
      bruteforceResults, // Résultats détaillés pour chaque formulaire
      summaryReport, // Synthèse et recommandations
    });
  } catch (error) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
