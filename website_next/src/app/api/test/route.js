import { NextResponse } from "next/server";
import { startCrawler, performXSSAttempt, performAdditionalCheck } from "./core";

export async function POST(req) {
  const { startUrl } = await req.json();
  if (!startUrl) {
    return NextResponse.json({ error: "startUrl is required" }, { status: 400 });
  }

  try {
    const crawlerResults = await startCrawler(startUrl);
    const xssResults = await performXSSAttempt(startUrl);
    const additionalCheckResults = await performAdditionalCheck(startUrl);

    return NextResponse.json({
      crawlerResults,
      xssResults,
      additionalCheckResults,
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
