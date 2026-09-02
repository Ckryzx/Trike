import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDashboardStats } from '@/lib/soroban'

// Dashboard de clientes: métricas agregadas, sin datos de ninguna cuenta en
// particular. Requiere sesión (Google OAuth) en vez de la clave de admin.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
