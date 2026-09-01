import { NextRequest, NextResponse } from 'next/server'
import { expireRequest } from '@/lib/soroban'

// Pensado para ser llamado por un job periódico (o manualmente) que barre
// solicitudes vencidas y las cancela. No requiere la firma de nadie en particular.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = Number(params.id)
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const result = await expireRequest(requestId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
