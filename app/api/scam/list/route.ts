import { NextRequest, NextResponse } from 'next/server'
import { listScamReports, getScamReportThreshold, serializeForJson } from '@/lib/soroban'

// Panel interno de admin: lista todas las cuentas reportadas. Se autentica con la
// misma clave compartida que el resto de acciones de admin/oracle.
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-oracle-key')
  if (!apiKey || apiKey !== process.env.ORACLE_API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const [reports, threshold] = await Promise.all([listScamReports(), getScamReportThreshold()])
    return NextResponse.json(serializeForJson({ reports, threshold }))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
