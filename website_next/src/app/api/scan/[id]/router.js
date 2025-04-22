import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(context) {
  const { id } = await context.params;
  const scanId = parseInt(id);

  if (isNaN(scanId)) {
    return NextResponse.json({ error: "Invalid scan ID" }, { status: 400 });
  }

  try {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
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
      return NextResponse.json({ error: "Scan not found" }, { status: 404 });
    }

    return NextResponse.json(scan);
  } catch {
    return NextResponse.json({ error: "Failed to fetch scan" }, { status: 500 });
  }
}
