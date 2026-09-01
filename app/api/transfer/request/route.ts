import { NextRequest, NextResponse } from 'next/server'
import { getScamStatus, prepareRequestTransfer } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

export async function POST(req: NextRequest) {
  const { owner, to, amount } = await req.json()

  if (!validateStellarAddress(owner) || !validateStellarAddress(to) || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  const scamStatus = await getScamStatus(to)
  if (scamStatus.blocked) {
    return NextResponse.json(
      {
        error: 'Esta cuenta de destino fue bloqueada por reportes de estafa. La transferencia no puede continuar.',
        blocked: true,
        scamReportCount: scamStatus.count,
      },
      { status: 403 }
    )
  }

  try {
    const xdr = await prepareRequestTransfer(owner, to, amount)
    return NextResponse.json({ xdr, scamReportCount: scamStatus.count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
