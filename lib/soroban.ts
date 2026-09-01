import {
  Contract,
  TransactionBuilder,
  Keypair,
  rpc,
  xdr,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk'
import { getHorizonServer, getOracleKeypair, NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from './stellar'

const CONTRACT_ID = process.env.TRIKE_CONTRACT_ID || ''

export const REQUEST_STATUS = ['PendingPrincipal', 'PendingSecondary', 'Approved', 'Cancelled'] as const
export type RequestStatusLabel = (typeof REQUEST_STATUS)[number]

export interface ProtectedAccount {
  owner: string
  principal_guardian: string
  secondary_guardian: string
  threshold: bigint
  avg_transfer: bigint
  max_transfer: bigint
  transfer_count: number
  recent_deposit_amount: bigint
  recent_deposit_at: bigint
}

export interface TransferRequest {
  id: bigint
  owner: string
  to: string
  amount: bigint
  created_at: bigint
  status: number
  statusLabel: RequestStatusLabel
  risky: boolean
  reason: string
  approved_by?: string
}

export interface ScamReport {
  target: string
  count: number
  reporters: string[]
  blocked: boolean
}

function getContract(): Contract {
  if (!CONTRACT_ID) throw new Error('TRIKE_CONTRACT_ID no está configurado')
  return new Contract(CONTRACT_ID)
}

function getRpcServer(): rpc.Server {
  return new rpc.Server(SOROBAN_RPC_URL)
}

const addressArg = (address: string) => nativeToScVal(address, { type: 'address' })
const u32Arg = (value: number) => nativeToScVal(value, { type: 'u32' })
const u64Arg = (value: number | bigint) => nativeToScVal(BigInt(value), { type: 'u64' })
const i128Arg = (value: number | bigint) => nativeToScVal(BigInt(value), { type: 'i128' })
const optionalI128Arg = (value: number | bigint | undefined) =>
  value === undefined ? xdr.ScVal.scvVoid() : i128Arg(value)

/** Construye una transacción sin firmar, lista para ser firmada por `sourceAddress`. */
async function buildUnsignedTx(
  sourceAddress: string,
  method: string,
  args: xdr.ScVal[]
): Promise<string> {
  const horizon = getHorizonServer()
  const rpcServer = getRpcServer()
  const account = await horizon.loadAccount(sourceAddress)
  const contract = getContract()

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(120)
    .build()

  const prepared = await rpcServer.prepareTransaction(tx)
  return prepared.toXDR()
}

/** Firma y envía una transacción ya preparada, usando una keypair que vive en el backend
 *  (solo la cuenta oracle). Para flujos donde firma el usuario, usar submitSignedTransaction. */
async function signAndSubmit(unsignedXdr: string, signer: Keypair) {
  const rpcServer = getRpcServer()
  const tx = TransactionBuilder.fromXDR(unsignedXdr, NETWORK_PASSPHRASE)
  tx.sign(signer)
  return waitForTransaction(await rpcServer.sendTransaction(tx))
}

async function waitForTransaction(sendResponse: rpc.Api.SendTransactionResponse) {
  if (sendResponse.status === 'ERROR') {
    throw new Error(`Envío falló: ${JSON.stringify(sendResponse.errorResult)}`)
  }

  const rpcServer = getRpcServer()
  const start = Date.now()
  let getResponse = await rpcServer.getTransaction(sendResponse.hash)
  while (getResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND && Date.now() - start < 30_000) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    getResponse = await rpcServer.getTransaction(sendResponse.hash)
  }

  if (getResponse.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    throw new Error(`Transacción no confirmada: ${getResponse.status}`)
  }

  const result = getResponse.returnValue ? scValToNative(getResponse.returnValue) : undefined
  return { hash: sendResponse.hash, result }
}

/** Recibe una transacción ya firmada por el cliente (Freighter) y la envía a la red. */
export async function submitSignedTransaction(signedXdr: string) {
  const rpcServer = getRpcServer()
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
  return waitForTransaction(await rpcServer.sendTransaction(tx))
}

async function simulateRead<T>(method: string, args: xdr.ScVal[]): Promise<T> {
  const rpcServer = getRpcServer()
  const oracle = getOracleKeypair()
  const horizon = getHorizonServer()
  const account = await horizon.loadAccount(oracle.publicKey())
  const contract = getContract()

  const tx = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build()

  const simulation = await rpcServer.simulateTransaction(tx)
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(`Simulación falló: ${simulation.error}`)
  }
  if (!simulation.result?.retval) {
    throw new Error('El contrato no retornó ningún valor')
  }
  return scValToNative(simulation.result.retval) as T
}

function toTransferRequest(raw: any): TransferRequest {
  return {
    ...raw,
    statusLabel: REQUEST_STATUS[raw.status] ?? 'PendingPrincipal',
  }
}

/** JSON.stringify no sabe serializar BigInt: convierte los campos numéricos del
 *  contrato (i128/u64) a number antes de que un route handler llame a NextResponse.json. */
export function serializeForJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? Number(v) : v)))
}

// --- Escritura: requieren la firma del owner/guardián, se preparan aquí y se firman en el cliente ---

export function prepareRegisterAccount(params: {
  owner: string
  principalGuardian: string
  secondaryGuardian: string
  threshold?: number
}) {
  return buildUnsignedTx(params.owner, 'register_account', [
    addressArg(params.owner),
    addressArg(params.principalGuardian),
    addressArg(params.secondaryGuardian),
    optionalI128Arg(params.threshold),
  ])
}

export function prepareSetThreshold(owner: string, threshold: number) {
  return buildUnsignedTx(owner, 'set_threshold', [addressArg(owner), i128Arg(threshold)])
}

export function prepareRequestTransfer(owner: string, to: string, amount: number) {
  return buildUnsignedTx(owner, 'request_transfer', [addressArg(owner), addressArg(to), i128Arg(amount)])
}

export function prepareApproveTransfer(guardian: string, requestId: number) {
  return buildUnsignedTx(guardian, 'approve_transfer', [addressArg(guardian), u64Arg(requestId)])
}

export function prepareRejectTransfer(guardian: string, requestId: number) {
  return buildUnsignedTx(guardian, 'reject_transfer', [addressArg(guardian), u64Arg(requestId)])
}

export function prepareReportScam(reporter: string, target: string) {
  return buildUnsignedTx(reporter, 'report_scam', [addressArg(reporter), addressArg(target)])
}

// --- Escritura firmada por el backend (cuenta oracle) ---

export async function recordDeposit(owner: string, amount: number) {
  const oracle = getOracleKeypair()
  const unsignedXdr = await buildUnsignedTx(oracle.publicKey(), 'record_deposit', [
    addressArg(oracle.publicKey()),
    addressArg(owner),
    i128Arg(amount),
  ])
  return signAndSubmit(unsignedXdr, oracle)
}

export async function expireRequest(requestId: number) {
  const oracle = getOracleKeypair()
  const unsignedXdr = await buildUnsignedTx(oracle.publicKey(), 'expire_request', [u64Arg(requestId)])
  return signAndSubmit(unsignedXdr, oracle)
}

/** Bloqueo definitivo de una cuenta reportada. Lo dispara el admin (el propio equipo
 *  de Trike) desde el panel interno; se firma con la cuenta oracle porque es la misma
 *  dirección configurada como admin del contrato. */
export async function adminBlockAccount(target: string) {
  const oracle = getOracleKeypair()
  const unsignedXdr = await buildUnsignedTx(oracle.publicKey(), 'admin_block_account', [
    addressArg(oracle.publicKey()),
    addressArg(target),
  ])
  return signAndSubmit(unsignedXdr, oracle)
}

// --- Lectura ---

export async function getAccount(owner: string): Promise<ProtectedAccount> {
  return simulateRead<ProtectedAccount>('get_account', [addressArg(owner)])
}

export async function getRequest(requestId: number): Promise<TransferRequest> {
  const raw = await simulateRead<any>('get_request', [u64Arg(requestId)])
  return toTransferRequest(raw)
}

export async function isApproved(requestId: number): Promise<boolean> {
  return simulateRead<boolean>('is_approved', [u64Arg(requestId)])
}

export async function getScamStatus(target: string): Promise<ScamReport> {
  return simulateRead<ScamReport>('get_scam_status', [addressArg(target)])
}

export async function getReportedCount(): Promise<number> {
  return simulateRead<number>('get_reported_count', [])
}

export async function getReportedAt(index: number): Promise<string | null> {
  return simulateRead<string | null>('get_reported_at', [u32Arg(index)])
}

export async function getScamReportThreshold(): Promise<number> {
  return simulateRead<number>('get_scam_report_threshold', [])
}

/** Recorre todas las cuentas reportadas (get_reported_count + get_reported_at) y trae
 *  el estado de reportes de cada una. Pensado para el panel de admin. */
export async function listScamReports(): Promise<ScamReport[]> {
  const total = await getReportedCount()
  const addresses: string[] = []
  for (let i = 0; i < total; i++) {
    const address = await getReportedAt(i)
    if (address) addresses.push(address)
  }
  return Promise.all(addresses.map((address) => getScamStatus(address)))
}
