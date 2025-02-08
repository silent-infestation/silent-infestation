import { NextResponse } from 'next/server';
import { compare } from 'bcrypt';
import prisma from '@prisma/client'
import { sign } from 'jsonwebtoken';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return NextResponse.json(
                { message: "Email or password error" },
                { status: 400 }
            );
        }

        const passwordMatch = await compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json(
                { message: "Email or password error" },
                { status: 400 }
            );
        }

        const token = sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '1d' }
        );

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "logged in successfully",
                user: userWithoutPassword,
                token
            },
            {
                status: 200,
                headers: {
                    'Set-Cookie': `token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
                }
            }
        );

    } catch (error) {
        return NextResponse.json(
            { message: "connection error" },
            { status: 500 }
        );
    }
}