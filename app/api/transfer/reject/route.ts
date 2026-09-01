import { NextRequest, NextResponse } from 'next/server'
import { prepareRejectTransfer } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { guardian, requestId } = await req.json()

  if (!validateStellarAddress(guardian) || typeof requestId !== 'number') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const xdr = await prepareRejectTransfer(guardian, requestId)
    return NextResponse.json({ xdr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
