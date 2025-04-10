import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

const scanStatusMap = global.scanStatusMap || new Map();
global.scanStatusMap = scanStatusMap;

export async function POST(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    const userStatus = scanStatusMap.get(userId) || {
      isRunning: false,
      status: 'not_started',
    };

    if (userStatus.isRunning) {
      return NextResponse.json(
        { message: "Scan déjà en cours pour cet utilisateur." },
        { status: 400 }
      );
    }

    userStatus.isRunning = true;
    userStatus.status = 'running';
    scanStatusMap.set(userId, userStatus);

    // fonction asynchrone de scan


    setTimeout(async () => {
      try {
        //  appel async réel
        // await lancerMonAudit(userId);

        userStatus.isRunning = false;
        userStatus.status = 'success';
        scanStatusMap.set(userId, userStatus);


      } catch (error) {
        console.error('Erreur dans le scan async :', error);
        userStatus.isRunning = false;
        userStatus.status = 'error';
        scanStatusMap.set(userId, userStatus);
      }
    }, 0);

    return NextResponse.json({ message: "Scan lancé pour l'utilisateur." });
  } catch (err) {
    console.error("Erreur vérification JWT :", err);
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
  }
}