import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret";

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
