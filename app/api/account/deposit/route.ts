import { NextRequest, NextResponse } from 'next/server'
import { recordDeposit } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

// Endpoint interno: lo llama el sistema que detecta el depósito real (ej. un listener
// de pagos entrantes), no el usuario final. Se autentica con una clave compartida.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-oracle-key')
  if (!apiKey || apiKey !== process.env.ORACLE_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { owner, amount } = await req.json()
  if (!validateStellarAddress(owner) || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  try {
    const result = await recordDeposit(owner, amount)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
