import { NextRequest, NextResponse } from 'next/server'
import { getRequest, serializeForJson } from '@/lib/soroban'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = Number(params.id)
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const request = await getRequest(requestId)
    return NextResponse.json(serializeForJson(request))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
}
