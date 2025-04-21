import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { parse } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export async function GET(req) {
  const token = parse(req.headers.get("cookie") || "").token;

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        surname: true,
        age: true,
        society: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("Token verification error:", err);
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}

export async function PUT(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    const body = await req.json();
    const { name, surname, email } = body;

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name,
        surname,
        email,
      },
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        role: true,
        age: true,
        society: true,
      },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (err) {
    console.error("Update user error:", err);
    return NextResponse.json({ error: "Unauthorized or invalid request" }, { status: 401 });
  }
}

export async function DELETE(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = parse(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.id) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    await prisma.user.delete({
      where: { id: decoded.id },
    });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Unauthorized or invalid request" }, { status: 401 });
  }
}
