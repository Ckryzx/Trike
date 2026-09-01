import { NextRequest, NextResponse } from 'next/server'
import { getScamStatus, serializeForJson } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function GET(_req: NextRequest, { params }: { params: { address: string } }) {
  if (!validateStellarAddress(params.address)) {
    return NextResponse.json({ error: 'Dirección Stellar inválida' }, { status: 400 })
  }

  try {
    const status = await getScamStatus(params.address)
    return NextResponse.json(serializeForJson(status))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
