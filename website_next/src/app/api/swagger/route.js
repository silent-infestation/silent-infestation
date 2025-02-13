// app/api/swagger/route.js
import { NextResponse } from 'next/server';
import swaggerConfig from '../../../../swaggerConfig.js';


export async function GET() {
  try {
    return NextResponse.json(swaggerConfig, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erreur GET /api/swagger :', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
