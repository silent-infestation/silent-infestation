// middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

// Appliquer seulement aux routes API que tu veux sécuriser
export const config = {
  matcher: [
    "/api/download/:path*",
    "/api/scan/:path*",
    "/api/sites/:path*",
    "/api/user/:path*",
    "/api/uploadTest/:path*",
  ],
};
