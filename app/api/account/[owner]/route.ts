import { NextRequest, NextResponse } from 'next/server'
import { getAccount, serializeForJson } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function GET(_req: NextRequest, { params }: { params: { owner: string } }) {
  if (!validateStellarAddress(params.owner)) {
    return NextResponse.json({ error: 'Dirección Stellar inválida' }, { status: 400 })
  }

  try {
    const account = await getAccount(params.owner)
    return NextResponse.json(serializeForJson(account))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
