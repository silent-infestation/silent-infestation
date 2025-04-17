import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getAuthUser(token) {
    try {
        console.log("[MAILER] Token reçu :");
        console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("[MAILER] Décodage du token :");
        console.log(decoded);
        return await prisma.user.findUnique({ where: { id: decoded.id } });
    } catch {

        return null;
    }
}