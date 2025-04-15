// app/api/launch-scan/route.js (or pages/api/launch-scan.js)
import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

import { runAudit } from "@/lib/security_checks/run_audit.js"; // <-- The big function from above

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

// Globally store user-specific scan status and results
const scanStatusMap = global.scanStatusMap || new Map();
global.scanStatusMap = scanStatusMap;

const scanResultsMap = global.scanResultsMap || new Map();
global.scanResultsMap = scanResultsMap;

export async function POST(req) {
  // 1) Verify token from cookies
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "Missing JWT token" }, { status: 401 });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
    if (!userId) {
      throw new Error("Invalid token (no userId).");
    }
  } catch (err) {
    console.error("JWT verification error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // 2) Parse the body to get the `startUrl`
  let body;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { startUrl } = body;

  if (!startUrl || !startUrl.startsWith("http")) {
    return NextResponse.json(
      { error: "startUrl must be a valid 'http://' or 'https://' URL." },
      { status: 400 }
    );
  }

  // 3) Check if user is already scanning
  const userStatus = scanStatusMap.get(userId) || {
    isRunning: false,
    status: "not_started",
  };
  if (userStatus.isRunning) {
    return NextResponse.json(
      { message: "A scan is already running for this user." },
      { status: 400 }
    );
  }

  // 4) Clear any old results for this user, so the new scan is fresh
  scanResultsMap.delete(userId);

  // 5) Mark user’s scan status as running
  userStatus.isRunning = true;
  userStatus.status = "running";
  scanStatusMap.set(userId, userStatus);

  // 6) Kick off async scan
  setTimeout(async () => {
    try {
      // Pass the userId for partial updates:
      const result = await runAudit(startUrl, userId);

      // Store the final result
      scanResultsMap.set(userId, result);

      // Mark success
      userStatus.isRunning = false;
      userStatus.status = "success";
      scanStatusMap.set(userId, userStatus);
    } catch (error) {
      console.error("Error in background scan:", error);
      userStatus.isRunning = false;
      userStatus.status = "error";
      scanStatusMap.set(userId, userStatus);
    }
  }, 0);

  // 7) Return immediately
  return NextResponse.json({ message: "Scan started." });
}
