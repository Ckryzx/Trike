'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trash } from '@phosphor-icons/react'
import { useWallet } from '@/lib/wallet-context'
import {
  approveTransfer,
  fetchRequest,
  rejectTransfer,
  REASON_LABELS,
  STATUS_LABELS,
  type TransferRequestView,
} from '@/lib/api-client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { RiskBadge, StatusBadge } from '@/components/ui/Badge'

const STORAGE_KEY = 'trike_guardian_watchlist'

function loadWatchlist(): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveWatchlist(ids: number[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export default function GuardianPage() {
  const { address, connect, connecting } = useWallet()
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [newId, setNewId] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    setWatchlist(loadWatchlist())
  }, [])

  const addToWatchlist = (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    const id = Number(newId)
    if (!Number.isInteger(id) || id <= 0) {
      setAddError('Ingresa un número de solicitud válido.')
      return
    }
    if (watchlist.includes(id)) {
      setAddError('Ya estás siguiendo esa solicitud.')
      return
    }
    const next = [id, ...watchlist]
    setWatchlist(next)
    saveWatchlist(next)
    setNewId('')
  }

  const removeFromWatchlist = (id: number) => {
    const next = watchlist.filter((existing) => existing !== id)
    setWatchlist(next)
    saveWatchlist(next)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Panel de guardián</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Revisa y aprueba las solicitudes de transferencia que tu familiar te comparta.
      </p>

      {!address && (
        <Card className="mb-8 flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-foreground">Conecta tu billetera para poder aprobar o rechazar.</p>
          <Button onClick={connect} disabled={connecting}>
            {connecting ? 'Conectando...' : 'Conectar Freighter'}
          </Button>
        </Card>
      )}

      <Card className="mb-8">
        <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">Seguir una solicitud</h2>
        <form onSubmit={addToWatchlist} className="flex items-end gap-3">
          <div className="flex-1">
            <Field
              label="Número de solicitud"
              name="requestId"
              type="number"
              min={1}
              placeholder="Ej: 12"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
            />
          </div>
          <Button type="submit">Agregar</Button>
        </form>
        {addError && <p className="mt-2 text-base font-medium text-destructive">{addError}</p>}
      </Card>

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {watchlist.map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RequestCard
                requestId={id}
                guardian={address}
                onRemove={() => removeFromWatchlist(id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {watchlist.length === 0 && (
          <p className="text-center text-base text-muted-foreground">No estás siguiendo ninguna solicitud aún.</p>
        )}
      </div>
    </div>
  )
}

function RequestCard({
  requestId,
  guardian,
  onRemove,
}: {
  requestId: number
  guardian: string | null
  onRemove: () => void
}) {
  const [request, setRequest] = useState<TransferRequestView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRequest(requestId)
      setRequest(data)
    } catch (err: any) {
      setError(err.message || 'No se encontró la solicitud')
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    load()
  }, [load])

  const act = async (action: 'approve' | 'reject') => {
    if (!guardian) return
    setActing(action)
    try {
      if (action === 'approve') await approveTransfer(guardian, requestId)
      else await rejectTransfer(guardian, requestId)
      await load()
    } catch (err: any) {
      setError(err.message || 'No se pudo procesar la acción')
    } finally {
      setActing(null)
    }
  }

  const pending = request && (request.statusLabel === 'PendingPrincipal' || request.statusLabel === 'PendingSecondary')

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-foreground">Solicitud #{requestId}</h3>
        <button
          onClick={onRemove}
          aria-label={`Dejar de seguir la solicitud ${requestId}`}
          className="rounded-lg p-2 text-muted-foreground hover:text-destructive"
        >
          <Trash size={20} aria-hidden="true" />
        </button>
      </div>

      {loading && <p className="text-base text-muted-foreground">Cargando...</p>}
      {error && <p className="text-base font-medium text-destructive">{error}</p>}

      {request && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <RiskBadge risky={request.risky} />
            <StatusBadge status={request.statusLabel} />
          </div>
          <p className="text-base text-foreground">{REASON_LABELS[request.reason] ?? request.reason}</p>
          <p className="text-base text-muted-foreground">{STATUS_LABELS[request.statusLabel]}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Monto</dt>
              <dd className="font-semibold text-foreground">{request.amount.toLocaleString('es-CL')} XLM</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Destino</dt>
              <dd className="break-all font-medium text-foreground">{request.to}</dd>
            </div>
          </dl>

          {pending && (
            <div className="mt-2 flex gap-3">
              <Button
                variant="success"
                disabled={!guardian || acting !== null}
                onClick={() => act('approve')}
                className="flex flex-1 items-center justify-center gap-2"
              >
                <Check size={20} weight="bold" aria-hidden="true" />
                {acting === 'approve' ? 'Aprobando...' : 'Aprobar'}
              </Button>
              <Button
                variant="danger"
                disabled={!guardian || acting !== null}
                onClick={() => act('reject')}
                className="flex flex-1 items-center justify-center gap-2"
              >
                <X size={20} weight="bold" aria-hidden="true" />
                {acting === 'reject' ? 'Rechazando...' : 'Rechazar'}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
