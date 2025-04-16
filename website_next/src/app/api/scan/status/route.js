import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";
const scanStatusMap = global.scanStatusMap || new Map();
const scanResultsMap = global.scanResultsMap || new Map();

export async function GET(req) {
  // 1) Verify JWT
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "Missing JWT token" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    if (!userId) throw new Error("Invalid token (no userId).");

    // 2) Grab user-specific status + partial results
    const userStatus = scanStatusMap.get(userId) || {
      isRunning: false,
      status: "not_started",
    };
    const scanResults = scanResultsMap.get(userId) || null;

    // 3) Return everything
    return NextResponse.json({
      status: userStatus.status,
      isRunning: userStatus.isRunning,
      scanResults: scanResults || {},
    });
  } catch (err) {
    console.error("JWT verification error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
