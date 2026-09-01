import { Horizon, Keypair, Networks } from '@stellar/stellar-sdk'

export const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
export const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org'
export const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === 'mainnet' ? Networks.PUBLIC : Networks.TESTNET

export function validateStellarAddress(address: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(address)
}

export function getHorizonServer(): Horizon.Server {
  return new Horizon.Server(HORIZON_URL)
}

// Cuenta oracle/admin del contrato: reporta depósitos y ejecuta el barrido de
// solicitudes vencidas. Es la única clave que vive en el backend.
export function getOracleKeypair(): Keypair {
  const secret = process.env.ORACLE_SECRET_KEY
  if (!secret) {
    throw new Error('ORACLE_SECRET_KEY no está configurada')
  }
  return Keypair.fromSecret(secret)
}
