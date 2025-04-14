// src/app/api/user/[id]/core.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function handleGetUser(params) {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const { password: _, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
}

export async function handleUpdateUser(request, params) {
  const body = await request.json();
  const { email, name, surname, age, society, scanID } = body;

  const updatedUser = await prisma.user.update({
    where: { id: parseInt(params.id) },
    data: { email, name, surname, age, society, scanID, updatedAt: new Date() },
  });

  const { password: _, ...userWithoutPassword } = updatedUser;
  return NextResponse.json(userWithoutPassword);
}

export async function handleDeleteUser(params) {
  await prisma.user.delete({
    where: { id: parseInt(params.id) },
  });

  return NextResponse.json({ message: "User deleted" }, { status: 200 });
}
