import { NextRequest, NextResponse } from 'next/server'
import { adminBlockAccount } from '@/lib/soroban'
import { validateStellarAddress } from '@/lib/stellar'

// Bloqueo definitivo: solo el admin (con la clave compartida) puede dispararlo.
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-oracle-key')
  if (!apiKey || apiKey !== process.env.ORACLE_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { target } = await req.json()
  if (!validateStellarAddress(target)) {
    return NextResponse.json({ error: 'Dirección Stellar inválida' }, { status: 400 })
  }

  try {
    const result = await adminBlockAccount(target)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
