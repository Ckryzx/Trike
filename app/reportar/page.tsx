'use client'

import { FormEvent, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldWarning, CheckCircle } from '@phosphor-icons/react'
import { useWallet } from '@/lib/wallet-context'
import { fetchScamStatus, isValidStellarAddress, reportScam, type ScamStatusView } from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'

export default function ReportarPage() {
  const { address, connect, connecting } = useWallet()
  const [target, setTarget] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ScamStatusView | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setStatus(null)

    if (!address) {
      setError('Conecta tu billetera para poder reportar.')
      return
    }
    if (!isValidStellarAddress(target)) {
      setError('Ingresa una dirección Stellar válida (empieza con G).')
      return
    }
    if (target === address) {
      setError('No puedes reportar tu propia cuenta.')
      return
    }

    setSubmitting(true)
    try {
      await reportScam(address, target)
      const updated = await fetchScamStatus(target)
      setStatus(updated)
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el reporte')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Reportar cuenta de estafa</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Si conoces una cuenta de Stellar que se está usando para estafar a otras personas, repórtala aquí.
        Cada reporte queda registrado en el contrato. Cuando una cuenta acumula suficientes reportes, el equipo
        de Trike la revisa y puede bloquearla de forma definitiva.
      </p>

      {!address && (
        <Card className="mb-8 flex flex-col items-center gap-4 text-center">
          <ShieldWarning size={48} weight="bold" className="text-primary" aria-hidden="true" />
          <p className="text-lg text-foreground">Conecta tu billetera para poder reportar una cuenta.</p>
          <Button onClick={connect} disabled={connecting}>
            {connecting ? 'Conectando...' : 'Conectar Freighter'}
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-heading text-xl font-semibold text-foreground">Datos de la cuenta a reportar</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Field
            label="Cuenta reportada"
            name="target"
            placeholder="G..."
            helperText="Dirección Stellar de la cuenta que está siendo usada para estafar."
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          {error && <p className="text-base font-medium text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="flex items-center justify-center gap-2">
            <ShieldWarning size={20} weight="bold" aria-hidden="true" />
            {submitting ? 'Enviando reporte...' : 'Reportar cuenta'}
          </Button>
        </form>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex flex-col gap-2 rounded-xl bg-muted p-4"
            >
              <div className="flex items-center gap-2 text-foreground">
                <CheckCircle size={20} weight="bold" className="text-accent" aria-hidden="true" />
                <span className="font-semibold">Reporte registrado</span>
              </div>
              <p className="text-base text-muted-foreground">
                Esta cuenta acumula {status.count} {status.count === 1 ? 'reporte' : 'reportes'} de estafa.
              </p>
              {status.blocked && (
                <p className="text-base font-semibold text-destructive">
                  Esta cuenta ya está bloqueada: las transferencias hacia ella son rechazadas automáticamente.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  )
}
