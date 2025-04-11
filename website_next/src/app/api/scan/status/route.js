import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const scanStatusMap = global.scanStatusMap || new Map();
global.scanStatusMap = scanStatusMap;

export async function GET(req) {
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

    const status = scanStatusMap.get(userId) || {
      isRunning: false,
      status: "not_started",
      result: null,
    };

    return NextResponse.json({
      isRunning: status.isRunning,
      status: status.status,
      result: status.result || null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
  }
}
