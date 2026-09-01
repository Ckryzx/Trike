import { NextRequest, NextResponse } from 'next/server'
import { prepareRegisterAccount } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { owner, principalGuardian, secondaryGuardian, threshold } = await req.json()

  if (![owner, principalGuardian, secondaryGuardian].every(validateStellarAddress)) {
    return NextResponse.json({ error: 'Direcciones Stellar inválidas' }, { status: 400 })
  }

  try {
    const xdr = await prepareRegisterAccount({ owner, principalGuardian, secondaryGuardian, threshold })
    return NextResponse.json({ xdr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
