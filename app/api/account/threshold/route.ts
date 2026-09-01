import { NextRequest, NextResponse } from 'next/server'
import { prepareSetThreshold } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { owner, threshold } = await req.json()

  if (!validateStellarAddress(owner) || typeof threshold !== 'number') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const xdr = await prepareSetThreshold(owner, threshold)
    return NextResponse.json({ xdr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
