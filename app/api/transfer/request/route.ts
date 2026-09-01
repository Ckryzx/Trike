import { NextRequest, NextResponse } from 'next/server'
import { prepareRequestTransfer } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { owner, to, amount } = await req.json()

  if (!validateStellarAddress(owner) || !validateStellarAddress(to) || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const xdr = await prepareRequestTransfer(owner, to, amount)
    return NextResponse.json({ xdr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
