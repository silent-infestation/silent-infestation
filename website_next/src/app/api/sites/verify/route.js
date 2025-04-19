// src/app/api/sites/verify/route.js
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function verifySite(site) {
<<<<<<< HEAD
    const fullUrl = `${site.url.replace(/\/$/, "")}/${site.urlPath}`;
    console.log("[VERIFY] URL complète :", fullUrl);
    try {
        const response = await fetch(fullUrl);
        console.log("[VERIFY] Vérification de l'URL :", fullUrl);
        console.log("[VERIFY] Status de la réponse :", response);
        if (!response   .ok) return false;
=======
  const fullUrl = `${site.url_site.replace(/\/$/, "")}/${site.urlPath}`;
  try {
    const response = await fetch(fullUrl);
    if (!response.ok) return false;
>>>>>>> 2273706f261d0e2c77a6bbe8b08a1d6b86bdcba2

    const content = await response.text();
    return content.includes(site.securityKey);
  } catch (err) {
    console.error(`[VERIFY] Erreur pour site ${site.id} :`, err.message);
    return false;
  }
}

export async function POST(request) {
<<<<<<< HEAD
    try {
        const { siteId } = await request.json();
        console.log("[POST] Vérification des sites");
        console.log(siteId)

        const sites = await prisma.site.findMany({
            where: {
                id: siteId,
                state: "unverified",
            }
=======
  try {
    const sites = await prisma.site.findMany({
      where: {
        id: request.siteId,
        state: "unverified",
        NOT: [{ securityKey: null }, { urlPath: null }],
      },
    });

    const results = [];
    for (const site of sites) {
      const isValid = await verifySite(site);
      if (isValid) {
        await prisma.site.update({
          where: { id: site.id },
          data: { state: "verified" },
>>>>>>> 2273706f261d0e2c77a6bbe8b08a1d6b86bdcba2
        });
      }
      results.push({ id: site.id, verified: isValid });
    }

    return new Response(JSON.stringify({ success: true, results }), { status: 200 });
  } catch (err) {
    console.error("[VERIFY] Erreur :", err.message);
    return new Response(JSON.stringify({ message: "Erreur vérification" }), { status: 500 });
  }
}
