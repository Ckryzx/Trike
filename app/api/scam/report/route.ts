import { NextRequest, NextResponse } from 'next/server'
import { prepareReportScam } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { reporter, target } = await req.json()

  if (![reporter, target].every(validateStellarAddress)) {
    return NextResponse.json({ error: 'Direcciones Stellar inválidas' }, { status: 400 })
  }
  if (reporter === target) {
    return NextResponse.json({ error: 'No puedes reportar tu propia cuenta' }, { status: 400 })
  }

  try {
    const xdr = await prepareReportScam(reporter, target)
    return NextResponse.json({ xdr })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
