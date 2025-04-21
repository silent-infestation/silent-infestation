import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export function middleware(req) {
  // Vérifie si le token JWT est présent dans les cookies
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifie si le token est valide
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(decoded);
    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  return NextResponse.next();
}

// Appliquer seulement aux routes API que tu veux sécuriser
export const config = {
  matcher: [
    "/api/downloadReport/:path*",
    "/api/scan/:path*",
    "/api/sites/:path*",
    "/api/user/:path*",
    "/api/auth/status",
  ],
};
