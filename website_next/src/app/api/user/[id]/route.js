import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        const authResult = await verifyAuth(token);

        if (!authResult.success) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: {
                id: parseInt(params.id)
            }
        });

        if (!user) {
            return NextResponse.json(
                { message: "User not found" },
                { status: 404 }
            );
        }

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        return NextResponse.json(
            { message: "Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        const authResult = await verifyAuth(token);

        if (!authResult.success) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { email, name, surname, age, society, scanID } = body;

        const updatedUser = await prisma.user.update({
            where: {
                id: parseInt(params.id)
            },
            data: {
                email,
                name,
                surname,
                age,
                society,
                scanID,
                updatedAt: new Date()
            }
        });

        const { password: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json(userWithoutPassword);

    } catch (error) {
        return NextResponse.json(
            { message: "Update error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const token = request.headers.get('Authorization')?.split(' ')[1];
        const authResult = await verifyAuth(token);

        if (!authResult.success) {
            return NextResponse.json(
                { message: "Non autorisé" },
                { status: 401 }
            );
        }

        await prisma.user.delete({
            where: {
                id: parseInt(params.id)
            }
        });

        return NextResponse.json(
            { message: "User deleted" },
            { status: 200 }
        );

    } catch (error) {
        return NextResponse.json(
            { message: "Error" },
            { status: 500 }
        );
    }
}

import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

export default prisma;

import { verify } from 'jsonwebtoken';

export const verifyAuth = async (token) => {
    if (!token) {
        return { success: false };
    }

    try {
        const decoded = verify(token, process.env.JWT_SECRET || 'default-secret');
        return { success: true, data: decoded };
    } catch (error) {
        return { success: false };
    }
};