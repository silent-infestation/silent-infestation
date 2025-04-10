import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { sign } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

export async function POST(req) {
  console.info("POST /api/auth/register");

  try {
    const reqBody = await req.json();
    let { email, password, name, surname, age, society } = reqBody;

    // Vérification des champs obligatoires
    if (!email || !password || !name || !surname || !age || !society) {
      return NextResponse.json(
        { message: "Tous les champs sont requis (email, password, name, surname, age, society)." },
        { status: 400 }
      );
    }

    // Conversion de l'âge en entier
    age = parseInt(age, 10);
    if (isNaN(age)) {
      return NextResponse.json({ message: "L'âge doit être un nombre valide." }, { status: 400 });
    }

    // Vérification si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email déjà utilisé." }, { status: 400 });
    }

    // Hachage du mot de passe
    const hashedPassword = await hash(password, 10);

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        surname,
        age,
        society,
        role: "guest",
      },
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

    // Générer le token JWT
    const token = sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    return NextResponse.json(
      {
        message: "Inscription réussie",
        user: newUser,
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`,
        },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);
    return NextResponse.json({ message: "Erreur serveur : " + error.message }, { status: 500 });
  }
}
