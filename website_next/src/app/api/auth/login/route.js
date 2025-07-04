import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sign } from "jsonwebtoken";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email et mot de passe sont requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        email: true,
        role: true,
        name: true,
        surname: true,
        age: true,
        society: true,
        createdAt: false,
        updatedAt: false,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "Email ou mot de passe incorrect" }, { status: 400 });
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ message: "Email ou mot de passe incorrect" }, { status: 400 });
    }

    const token = sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: "1d" }
    );

    return NextResponse.json(
      {
        message: "Connexion réussie",
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
