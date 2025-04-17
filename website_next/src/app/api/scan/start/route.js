import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { runAudit } from "@/scripts/audit/index.js";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export async function POST(req) {
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
    if (!userId) throw new Error("No user ID in token");
  } catch (err) {
    console.error("JWT error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { startUrl } = await req.json();
  if (!startUrl || !startUrl.startsWith("http")) {
    return NextResponse.json({ error: "Invalid start URL." }, { status: 400 });
  }

  // Check for running scan
  const existingRunning = await prisma.scan.findFirst({
    where: { userId, isRunning: true },
  });

  if (existingRunning) {
    return NextResponse.json({ message: "Scan already running." }, { status: 400 });
  }

  // Create a new scan entry
  const newScan = await prisma.scan.create({
    data: {
      userId,
      url: startUrl,
      status: "running",
      isRunning: true,
    },
  });

  // Kick off async scan (runAudit handles all DB inserts)
  setTimeout(async () => {
    try {
      await runAudit(startUrl, userId);
    } catch (err) {
      console.error("[scan/start] Scan failed:", err);
      // Fallback in case runAudit did not mark it
      await prisma.scan.update({
        where: { id: newScan.id },
        data: { isRunning: false, status: "error" },
      });
    }
  }, 0);

  return NextResponse.json({ message: "Scan started." });
}
