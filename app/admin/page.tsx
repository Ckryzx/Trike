'use client'

import { FormEvent, useState } from 'react'
import { LockKey, Prohibit, ShieldWarning } from '@phosphor-icons/react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'

interface ScamReportRow {
  target: string
  count: number
  reporters: string[]
  blocked: boolean
}

export default function AdminPage() {
  const [apiKey, setApiKey] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ScamReportRow[]>([])
  const [threshold, setThreshold] = useState(5)
  const [blockingTarget, setBlockingTarget] = useState<string | null>(null)

  const loadReports = async (key: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scam/list', { headers: { 'x-oracle-key': key } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No autorizado')
      setReports(data.reports)
      setThreshold(data.threshold)
      setUnlocked(true)
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar el panel')
      setUnlocked(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault()
    await loadReports(apiKey)
  }

  const handleBlock = async (target: string) => {
    setBlockingTarget(target)
    setError(null)
    try {
      const res = await fetch('/api/scam/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-oracle-key': apiKey },
        body: JSON.stringify({ target }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudo bloquear la cuenta')
      await loadReports(apiKey)
    } catch (err: any) {
      setError(err.message || 'No se pudo bloquear la cuenta')
    } finally {
      setBlockingTarget(null)
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Panel de admin</h1>
        <p className="mb-10 text-lg text-muted-foreground">
          Ingresa la clave de administrador para revisar las cuentas reportadas por estafa.
        </p>
        <Card>
          <form onSubmit={handleUnlock} className="flex flex-col gap-6">
            <Field
              label="Clave de admin"
              name="apiKey"
              type="password"
              placeholder="••••••••"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            {error && <p className="text-base font-medium text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="flex items-center justify-center gap-2">
              <LockKey size={20} weight="bold" aria-hidden="true" />
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Cuentas reportadas</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Umbral de revisión: {threshold} reportes o más. Bloquear una cuenta corta de inmediato cualquier
        transferencia futura hacia ella.
      </p>

      {error && <p className="mb-6 text-base font-medium text-destructive">{error}</p>}

      {reports.length === 0 && <p className="text-lg text-muted-foreground">Aún no hay cuentas reportadas.</p>}

      <div className="flex flex-col gap-4">
        {reports
          .slice()
          .sort((a, b) => b.count - a.count)
          .map((report) => (
            <Card key={report.target} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="break-all text-sm font-medium text-foreground">{report.target}</span>
                <div className="flex items-center gap-2">
                  <ShieldWarning
                    size={18}
                    weight="bold"
                    className={report.count >= threshold ? 'text-destructive' : 'text-muted-foreground'}
                    aria-hidden="true"
                  />
                  <span className="text-base text-muted-foreground">
                    {report.count} {report.count === 1 ? 'reporte' : 'reportes'}
                  </span>
                  {report.blocked && (
                    <span className="rounded-full bg-danger-bg px-3 py-1 text-sm font-semibold text-danger-foreground">
                      Bloqueada
                    </span>
                  )}
                </div>
              </div>
              {!report.blocked && (
                <Button
                  variant="danger"
                  disabled={blockingTarget === report.target}
                  onClick={() => handleBlock(report.target)}
                  className="flex items-center justify-center gap-2"
                >
                  <Prohibit size={18} weight="bold" aria-hidden="true" />
                  {blockingTarget === report.target ? 'Bloqueando...' : 'Bloquear definitivamente'}
                </Button>
              )}
            </Card>
          ))}
      </div>
    </div>
  )
}
