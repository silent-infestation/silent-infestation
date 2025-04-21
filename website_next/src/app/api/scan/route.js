import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserByToken } from "@/utils/auth";
import { parse } from "cookie";

function computeScanStatus(findings) {
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;

  if (highCount >= 3) return "danger";
  if (mediumCount >= 3 || highCount > 0) return "warning";
  return "safe";
}

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = parse(cookieHeader);
    const user = await getUserByToken(cookies.token);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 10;

    const skip = (page - 1) * pageSize;

    const scans = await prisma.scan.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        scannedAt: "desc",
      },
      skip,
      take: pageSize,
      include: {
        scanResult: {
          include: {
            findings: true,
          },
        },
      },
    });

    const scansWithStatus = scans.map((scan) => {
      const findings = scan.scanResult?.findings || [];
      const status = computeScanStatus(findings);

      return {
        id: scan.id,
        url: scan.url,
        scannedAt: scan.scannedAt,
        status,
      };
    });

    const total = await prisma.scan.count({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      scans: scansWithStatus,
      total,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
