#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.DEFAULT_ADMIN_EMAIL;
  const password = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "❌ DEFAULT_ADMIN_EMAIL ou DEFAULT_ADMIN_PASSWORD manquant dans les variables d’environnement."
    );
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.info("Admin user already exists.");
    return;
  }
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      role: "ADMIN",
      name: "Admin",
      surname: "User",
      age: 30,
      society: "MyCompany",
      scanID: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.info("Admin user ensured to exist.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
