// src/app/api/sites/verify/route.js
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";
import fetch from "node-fetch";

const prisma = new PrismaClient();

async function verifySite(site) {
    const fullUrl = `${site.url_site.replace(/\/$/, "")}/${site.urlPath}`;
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) return false;

        const content = await response.text();
        return content.includes(site.securityKey);
    } catch (err) {
        console.error(`[VERIFY] Erreur pour site ${site.id} :`, err.message);
        return false;
    }
}

export async function POST(request) {
    try {
        const sites = await prisma.site.findMany({
            where: {
                id: request.siteId,
                state: "unverified",
                NOT: [{ securityKey: null }, { urlPath: null }]
            }
        });

        const results = [];
        for (const site of sites) {
            const isValid = await verifySite(site);
            if (isValid) {
                await prisma.site.update({
                    where: { id: site.id },
                    data: { state: "verified" }
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
