import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    const authResult = await verifyAuth(token);

    if (!authResult.success) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;
    const userId = authResult.data.id;

    await prisma.scan.create({
      data: {
        userId,
        status: 'running',
        type: 'form-scan',
        target: url,
        progress: 0,
      },
    });

    // ajouter les futures fonctionnalités de scan ici
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: error.status || 500 });
  }
}
