import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export function middleware(req) {
  const token = req.cookies.get("token");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export async function getUserByToken(token) {
  if (!token) {
    throw new Error("Missing token");
  }
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded) {
    throw new Error("Invalid token");
  }
  return await prisma.user.findUnique({
    where: { id: decoded.id },
  });
}
