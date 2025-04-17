// src/app/api/sites/route.js (Next.js App Router compatible)

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

function generateSecurityKey() {
  return Math.random().toString(36).substring(2, 15);
}

function generateAuthUrl() {
  return `https://example.com/auth/${Math.random().toString(36).substring(2, 15)}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const cookies = request.headers.get("cookie") || "";
    const tokenCookie = cookies.split("; ").find(c => c.startsWith("token="));
    const token = tokenCookie ? tokenCookie.split("=")[1] : null;

    console.log("Token reçu :", token);

    const authUser = await getAuthUser(token);

    console.log("[GET] Token reçu :");
    console.log(authUser);

    if (!authUser) return new Response(JSON.stringify({ message: "Utilisateur non authentifié" }), { status: 401 });

    if (id) {
      const site = await prisma.site.findFirst({
        where: {
          id: parseInt(id),
          userId: authUser.id,
        },
      });
      if (!site) {
        return new Response(JSON.stringify({ message: "Site non trouvé." }), { status: 404 });
      }
      return Response.json(site);
    } else {
      const sites = await prisma.site.findMany({
        where: { userId: authUser.id },
      });
      return Response.json(sites);
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Erreur lors de la récupération des sites." }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url_site, userId } = body;

    if (!url_site || !userId) {
      return new Response(JSON.stringify({ message: "données manquantes" }), { status: 400 });
    }
    console.log("[POST] Ajout d'un site");
    console.log("URL du site :", url_site);
    console.log("ID de l'utilisateur :", userId);

    const newSite = await prisma.site.create({
      data: {
        url: url_site,
        userId: parseInt(userId),
        state: "pending"
      },
    });

    return new Response(JSON.stringify(newSite), { status: 201 });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Erreur lors de l'ajout du site." }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, url_site, state } = body;

    if (!id) return new Response(JSON.stringify({ message: "ID requis." }), { status: 400 });

    const token = request.headers.get("authorization")?.split(" ")[1];
    const user = await getAuthUser(token);
    if (!user) return new Response(JSON.stringify({ message: "Utilisateur non authentifié" }), { status: 401 });

    const existingSite = await prisma.site.findFirst({
      where: { id: parseInt(id), userId: user.id },
    });

    if (!existingSite) {
      return new Response(JSON.stringify({ message: "Site non trouvé." }), { status: 404 });
    }

    const updatedSite = await prisma.site.update({
      where: { id: parseInt(id) },
      data: {
        url_site: url_site || existingSite.url_site,
        state: state || existingSite.state,
      },
    });

    return Response.json(updatedSite);
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Erreur lors de la mise à jour." }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get("siteId");
    console.log("siteId reçu :", siteId);
    if (!siteId) {
      return new Response(JSON.stringify({ message: "ID requis." }), { status: 400 });
    }

    const existingSite = await prisma.site.findFirst({
      where: { id: parseInt(siteId), id: parseInt(siteId) },
    });

    if (!existingSite) {
      return new Response(JSON.stringify({ message: "Site non trouvé." }), { status: 404 });
    }

    await prisma.site.delete({
      where: { id: parseInt(siteId) },
    });

    return new Response(JSON.stringify({ message: "Site supprimé." }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Erreur lors de la suppression." }), { status: 500 });
  }
}

