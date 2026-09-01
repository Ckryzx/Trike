'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, PaperPlaneTilt } from '@phosphor-icons/react'
import { useWallet } from '@/lib/wallet-context'
import {
  fetchAccount,
  fetchRequest,
  isValidStellarAddress,
  registerAccount,
  requestTransfer,
  REASON_LABELS,
  STATUS_LABELS,
  type ProtectedAccountView,
  type TransferRequestView,
} from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'

export default function CuentaPage() {
  const { address, connect, connecting } = useWallet()
  const [account, setAccount] = useState<ProtectedAccountView | null>(null)
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const loadAccount = useCallback(async (owner: string) => {
    setLoadingAccount(true)
    setNotFound(false)
    try {
      const data = await fetchAccount(owner)
      setAccount(data)
    } catch {
      setAccount(null)
      setNotFound(true)
    } finally {
      setLoadingAccount(false)
    }
  }, [])

  useEffect(() => {
    if (address) loadAccount(address)
  }, [address, loadAccount])

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Mi cuenta protegida</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Conecta tu billetera Stellar para configurar tu protección o enviar una transferencia.
      </p>

      {!address && (
        <Card className="flex flex-col items-center gap-4 text-center">
          <ShieldCheck size={48} weight="bold" className="text-primary" aria-hidden="true" />
          <p className="text-lg text-foreground">Aún no has conectado tu billetera.</p>
          <Button onClick={connect} disabled={connecting}>
            {connecting ? 'Conectando...' : 'Conectar Freighter'}
          </Button>
        </Card>
      )}

      {address && loadingAccount && <p className="text-lg text-muted-foreground">Cargando tu cuenta...</p>}

      {address && !loadingAccount && notFound && (
        <RegisterAccountForm owner={address} onRegistered={() => loadAccount(address)} />
      )}

      {address && !loadingAccount && account && (
        <div className="flex flex-col gap-8">
          <AccountSummary account={account} />
          <RequestTransferForm owner={address} onDone={() => loadAccount(address)} />
        </div>
      )}
    </div>
  )
}

function AccountSummary({ account }: { account: ProtectedAccountView }) {
  return (
    <Card>
      <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Tu protección activa</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-base text-muted-foreground">Umbral de aprobación</dt>
          <dd className="text-lg font-semibold text-foreground">{account.threshold.toLocaleString('es-CL')} XLM</dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Transferencias realizadas</dt>
          <dd className="text-lg font-semibold text-foreground">{account.transfer_count}</dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Guardián principal</dt>
          <dd className="break-all text-sm font-medium text-foreground">{account.principal_guardian}</dd>
        </div>
        <div>
          <dt className="text-base text-muted-foreground">Guardián secundario</dt>
          <dd className="break-all text-sm font-medium text-foreground">{account.secondary_guardian}</dd>
        </div>
      </dl>
    </Card>
  )
}

function RegisterAccountForm({ owner, onRegistered }: { owner: string; onRegistered: () => void }) {
  const [principalGuardian, setPrincipalGuardian] = useState('')
  const [secondaryGuardian, setSecondaryGuardian] = useState('')
  const [threshold, setThreshold] = useState('20000')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidStellarAddress(principalGuardian) || !isValidStellarAddress(secondaryGuardian)) {
      setError('Ingresa direcciones Stellar válidas para ambos guardianes (empiezan con G).')
      return
    }

    setSubmitting(true)
    try {
      await registerAccount({
        owner,
        principalGuardian,
        secondaryGuardian,
        threshold: threshold ? Number(threshold) : undefined,
      })
      onRegistered()
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar la cuenta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-2 font-heading text-xl font-semibold text-foreground">Configura tu protección</h2>
      <p className="mb-6 text-base text-muted-foreground">
        Elige a dos personas de confianza como guardianes. Podrán revisar y aprobar transferencias riesgosas.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Guardián principal"
          name="principalGuardian"
          placeholder="G..."
          helperText="Dirección Stellar de la primera persona que podrá aprobar."
          value={principalGuardian}
          onChange={(e) => setPrincipalGuardian(e.target.value)}
        />
        <Field
          label="Guardián secundario"
          name="secondaryGuardian"
          placeholder="G..."
          helperText="Podrá aprobar si el guardián principal no responde a tiempo."
          value={secondaryGuardian}
          onChange={(e) => setSecondaryGuardian(e.target.value)}
        />
        <Field
          label="Umbral de monto (XLM)"
          name="threshold"
          type="number"
          min={0}
          helperText="Transferencias iguales o mayores a este monto necesitarán aprobación. Por defecto 20.000."
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
        />
        {error && <p className="text-base font-medium text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Registrando...' : 'Activar protección'}
        </Button>
      </form>
    </Card>
  )
}

function RequestTransferForm({ owner, onDone }: { owner: string; onDone: () => void }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TransferRequestView | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)

    if (!isValidStellarAddress(to)) {
      setError('Ingresa una dirección Stellar válida de destino.')
      return
    }
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Ingresa un monto válido.')
      return
    }

    setSubmitting(true)
    try {
      const { requestId } = await requestTransfer(owner, to, parsedAmount)
      const request = await fetchRequest(requestId)
      setResult(request)
      onDone()
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la solicitud de transferencia')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h2 className="mb-2 font-heading text-xl font-semibold text-foreground">Enviar transferencia</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Field
          label="Enviar a"
          name="to"
          placeholder="G..."
          helperText="Dirección Stellar de quien recibirá el dinero."
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Field
          label="Monto (XLM)"
          name="amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        {error && <p className="text-base font-medium text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="flex items-center justify-center gap-2">
          <PaperPlaneTilt size={20} weight="bold" aria-hidden="true" />
          {submitting ? 'Enviando...' : 'Solicitar transferencia'}
        </Button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex flex-col gap-3 rounded-xl bg-muted p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <RiskBadge risky={result.risky} />
              <StatusBadge status={result.statusLabel} />
            </div>
            <p className="text-base text-foreground">{REASON_LABELS[result.reason] ?? result.reason}</p>
            <p className="text-base text-muted-foreground">{STATUS_LABELS[result.statusLabel]}</p>
            {result.statusLabel !== 'Approved' && (
              <p className="text-base font-semibold text-foreground">
                Comparte este número con tu guardián: solicitud #{result.id}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
