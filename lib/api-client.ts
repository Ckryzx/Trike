'use client'

import freighterApi from '@stellar/freighter-api'

// Testnet passphrase (información pública, no un secreto) — Trike corre sobre Testnet en esta demo.
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

export function isValidStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address)
}

export interface ProtectedAccountView {
  owner: string
  principal_guardian: string
  secondary_guardian: string
  threshold: number
  avg_transfer: number
  max_transfer: number
  transfer_count: number
  recent_deposit_amount: number
  recent_deposit_at: number
}

export type RequestStatusLabel = 'PendingPrincipal' | 'PendingSecondary' | 'Approved' | 'Cancelled'

export interface TransferRequestView {
  id: number
  owner: string
  to: string
  amount: number
  created_at: number
  status: number
  statusLabel: RequestStatusLabel
  risky: boolean
  reason: string
  approved_by?: string
}

export interface ScamStatusView {
  target: string
  count: number
  reporters: string[]
  blocked: boolean
}

export class TrikeApiError extends Error {
  blocked?: boolean
  scamReportCount?: number

  constructor(message: string, extra?: { blocked?: boolean; scamReportCount?: number }) {
    super(message)
    this.blocked = extra?.blocked
    this.scamReportCount = extra?.scamReportCount
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new TrikeApiError(data.error || 'Error de red', { blocked: data.blocked, scamReportCount: data.scamReportCount })
  }
  return data as T
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error de red')
  return data as T
}

/** Firma con Freighter el XDR preparado por el backend y lo envía a la red. */
async function signAndSubmit(xdr: string, signerAddress: string): Promise<{ hash: string; result: any }> {
  const signed = await freighterApi.signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address: signerAddress,
  })
  if (signed.error) {
    throw new Error(signed.error.message ?? 'Freighter rechazó la firma')
  }
  return postJson('/api/tx/submit', { signedXdr: signed.signedTxXdr })
}

export async function registerAccount(params: {
  owner: string
  principalGuardian: string
  secondaryGuardian: string
  threshold?: number
}) {
  const { xdr } = await postJson<{ xdr: string }>('/api/account/register', params)
  return signAndSubmit(xdr, params.owner)
}

export async function requestTransfer(owner: string, to: string, amount: number) {
  const { xdr } = await postJson<{ xdr: string }>('/api/transfer/request', { owner, to, amount })
  const { hash, result } = await signAndSubmit(xdr, owner)
  return { hash, requestId: result as number }
}

export async function approveTransfer(guardian: string, requestId: number) {
  const { xdr } = await postJson<{ xdr: string }>('/api/transfer/approve', { guardian, requestId })
  return signAndSubmit(xdr, guardian)
}

export async function rejectTransfer(guardian: string, requestId: number) {
  const { xdr } = await postJson<{ xdr: string }>('/api/transfer/reject', { guardian, requestId })
  return signAndSubmit(xdr, guardian)
}

export async function fetchAccount(owner: string): Promise<ProtectedAccountView> {
  return getJson(`/api/account/${owner}`)
}

export async function reportScam(reporter: string, target: string) {
  const { xdr } = await postJson<{ xdr: string }>('/api/scam/report', { reporter, target })
  return signAndSubmit(xdr, reporter)
}

export async function fetchScamStatus(target: string): Promise<ScamStatusView> {
  return getJson(`/api/scam/${target}`)
}

export async function fetchRequest(requestId: number): Promise<TransferRequestView> {
  return getJson(`/api/transfer/${requestId}`)
}

export const REASON_LABELS: Record<string, string> = {
  THRESHOLD: 'Supera el monto máximo configurado',
  BEHAVIOR: 'Monto muy superior a lo habitual',
  DEPOSIT: 'Depósito reciente sospechoso en la cuenta',
  MULTIPLE: 'Varias señales de riesgo a la vez',
  NONE: 'Sin señales de riesgo',
}

export const STATUS_LABELS: Record<RequestStatusLabel, string> = {
  PendingPrincipal: 'Esperando aprobación del guardián principal',
  PendingSecondary: 'Esperando aprobación del guardián secundario',
  Approved: 'Aprobada',
  Cancelled: 'Cancelada',
}
