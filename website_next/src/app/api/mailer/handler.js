import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
    transporter,
    generateSecurityCredentials,
    createSecurityEmailContent,
    createContactEmailContent,
} from "./core";
const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { type, destinataire, siteId } = await request.json();


        let mailOptions = {};
        let extraData = {};
        const sujet = "SI3 Authentification service";
        const creds = generateSecurityCredentials()
        const message = createSecurityEmailContent()


        if (type === "contact") {

            if (!email) {
                return NextResponse.json(
                    { error: "Email requis pour un message de contact." },
                    { status: 400 }
                );
            }

            mailOptions = {
                from: `"Contact App" <${process.env.EMAIL_USER}>`,
                to: process.env.ADMIN_EMAIL,
                replyTo: email,
                subject: `[Contact App] ${sujet}`,
                text: `${message}\n\nEnvoyé par : ${email}`,
                html: createContactEmailContent(email, sujet, message),
            };
        } else if (type === "security") {

            if (!destinataire || !siteId) {
                return NextResponse.json(
                    { error: "Destinataire et siteIDdrequis pour un mail de sécurité." },
                    { status: 400 }
                );
            }

            const { securityKey, urlPath } = generateSecurityCredentials();

            // Mise à jour du site dans la base de données
            try {
                const updatedSite = await prisma.site.update({
                    where: { id: parseInt(siteId) },
                    data: {
                        securityKey,
                        urlPath,
                        state: "unverified"
                    }
                });

                mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: destinataire,
                    subject: sujet,
                    text: `${message}\n\nURL : http://votresite.com/${urlPath}\nClé : ${securityKey}`,
                    html: createSecurityEmailContent(securityKey, urlPath), // Utilisez les variables directement
                };

                extraData = {
                    credentials: {
                        securityKey,
                        urlPath,
                        destinataire,
                        createdAt: new Date().toISOString(),
                        updatedSite // Retourne les infos du site mis à jour
                    },
                };

            } catch (dbError) {
                console.error("[MAILER] Erreur DB:", dbError);
                return NextResponse.json(
                    { error: "Erreur lors de la mise à jour du site", details: dbError.message },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json({ error: "Type d'email inconnu." }, { status: 400 });
        }

        const info = await transporter.sendMail(mailOptions);
        await transporter.verify().catch((err) => {
            console.error("[MAILER] Erreur transporteur :", err);
        });

        return NextResponse.json({ success: true, messageId: info.messageId, ...extraData });
    } catch (error) {
        return NextResponse.json({ error: "Erreur email", details: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "Service email opérationnel",
        timestamp: new Date().toISOString(),
    });
}