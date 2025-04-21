export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export async function POST(req) {
  // 1⃣  Auth—same pattern as your other routes
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) return NextResponse.json({ error: "Missing JWT token" }, { status: 401 });

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
    if (!userId) throw new Error("No user ID in token");
  } catch (err) {
    console.error("JWT error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // 2⃣  Find the running scan for this user
  const runningScan = await prisma.scan.findFirst({
    where: { userId, isRunning: true },
  });

  if (!runningScan)
    return NextResponse.json({ message: "No running scan to terminate." }, { status: 400 });

  if (runningScan.pid) {
    try {
      process.kill(runningScan.pid, "SIGTERM");
    } catch (err) {
      if (err.code === "ESRCH") {
        console.warn(`Process ${runningScan.pid} already exited, no need to kill.`);
      } else {
        console.error(`Failed to kill process ${runningScan.pid}:`, err);
      }
    }
  }

  // 4⃣  Update DB
  await prisma.scan.update({
    where: { id: runningScan.id },
    data: { isRunning: false, status: "terminated" },
  });

  return NextResponse.json({ message: "Scan terminated." });
}
