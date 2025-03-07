import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // const token = request.headers.get('Authorization')?.split(' ')[1];
    // if (!authResult.success) {
    //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }
    // const body = await request.json();
    // const { url } = body;
    // const userId = authResult.data.id;
    // await prisma.scan.create({
    //   data: {
    //     userId,
    //     status: 'running',
    //     type: 'form-scan',
    //     target: url,
    //     progress: 0,
    //   },
    // });
    // ajouter les futures fonctionnalités de scan ici
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: error.status || 500 });
  }
}
