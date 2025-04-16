import { NextResponse } from "next/server";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import {
  generateSummaryReport,
  findingToRecommendation,
  securityResources,
} from "@/scripts/audit/utils/findings";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export async function GET(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) return NextResponse.json({ error: "Missing JWT token" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    if (!userId) throw new Error("Invalid token (no userId).");

    // Get latest scan with result and findings
    const scan = await prisma.scan.findFirst({
      where: { userId },
      orderBy: { scannedAt: "desc" },
      include: {
        scanResult: {
          include: {
            crawledUrls: true,
            findings: true,
          },
        },
      },
    });

    if (!scan) {
      return NextResponse.json({
        status: "not_started",
        isRunning: false,
        scanResults: {},
      });
    }

    const { status, isRunning, scanResult } = scan;

    const scanResults = scanResult
      ? {
          crawledUrls: scanResult.crawledUrls,
          securityFindings: scanResult.findings,
          recommendationReport: generateSummaryReport(
            scanResult.findings,
            findingToRecommendation,
            securityResources
          ),
        }
      : {};

    return NextResponse.json({
      status,
      isRunning,
      scanResults,
    });
  } catch (err) {
    console.error("JWT verification error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
