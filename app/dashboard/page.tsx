'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { ShieldCheck, PaperPlaneTilt, Prohibit, GoogleLogo, SignOut } from '@phosphor-icons/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { DashboardStats } from '@/lib/soroban'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    setError(null)
    fetch('/api/dashboard/stats')
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'No se pudo cargar el dashboard')
        setStats(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [status])

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mb-10 text-lg text-muted-foreground">
          Inicia sesión para ver las métricas agregadas de Trike.
        </p>
        <Card className="flex flex-col items-center gap-4 text-center">
          <ShieldCheck size={48} weight="bold" className="text-primary" aria-hidden="true" />
          <Button onClick={() => signIn('google')} className="flex items-center justify-center gap-2">
            <GoogleLogo size={20} weight="bold" aria-hidden="true" />
            Iniciar sesión con Google
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Hola, {session?.user?.name ?? session?.user?.email}. Métricas agregadas de Trike.
          </p>
        </div>
        <Button variant="secondary" onClick={() => signOut()} className="flex items-center justify-center gap-2">
          <SignOut size={20} weight="bold" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>

      {loading && <p className="text-lg text-muted-foreground">Cargando métricas...</p>}
      {error && <p className="text-base font-medium text-destructive">{error}</p>}

      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatCard
            icon={<ShieldCheck size={28} weight="bold" className="text-primary" aria-hidden="true" />}
            label="Cuentas protegidas"
            value={stats.accountCount}
          />
          <StatCard
            icon={<PaperPlaneTilt size={28} weight="bold" className="text-primary" aria-hidden="true" />}
            label="Transferencias procesadas"
            value={stats.transferCount}
          />
          <StatCard
            icon={<Prohibit size={28} weight="bold" className="text-destructive" aria-hidden="true" />}
            label="Cuentas bloqueadas por estafa"
            value={stats.blockedCount}
          />
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="flex flex-col items-start gap-3">
      {icon}
      <span className="text-3xl font-bold text-foreground">{value.toLocaleString('es-CL')}</span>
      <span className="text-base text-muted-foreground">{label}</span>
    </Card>
  )
}
