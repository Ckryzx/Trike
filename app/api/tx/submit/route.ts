import { NextRequest, NextResponse } from 'next/server'
import { submitSignedTransaction, serializeForJson } from '@/lib/soroban'

// Endpoint genérico: recibe una transacción ya firmada por el cliente (Freighter)
// para cualquiera de los flujos preparados en /api/account/* o /api/transfer/*.
export async function POST(req: NextRequest) {
  const { signedXdr } = await req.json()

  if (typeof signedXdr !== 'string' || signedXdr.length === 0) {
    return NextResponse.json({ error: 'signedXdr es requerido' }, { status: 400 })
  }

  try {
    const result = await submitSignedTransaction(signedXdr)
    return NextResponse.json(serializeForJson(result))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
