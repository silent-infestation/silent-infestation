import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        password: hashedPassword, // Stockage du mot de passe haché
        name,
        surname,
        age,
        society,
        role: "guest",
      },
    });

    console.info("Nouvel utilisateur créé :", newUser);

    return NextResponse.json(
      { message: "Utilisateur créé avec succès.", user: { email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur :", error);

    return NextResponse.json({ message: "Erreur serveur : " + error.message }, { status: 500 });
  }
}
