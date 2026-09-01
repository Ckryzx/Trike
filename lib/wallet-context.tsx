'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import freighterApi from '@stellar/freighter-api'

interface WalletContextValue {
  address: string | null
  connecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextValue | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const connected = await freighterApi.isConnected()
      if (!connected.isConnected) {
        setError('No se detectó la extensión Freighter. Instálala desde freighter.app')
        return
      }
      const result = await freighterApi.requestAccess()
      if (result.error) {
        setError(result.error.message ?? 'No se pudo conectar con Freighter')
        return
      }
      setAddress(result.address)
    } catch {
      setError('No se pudo conectar con Freighter')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ address, connecting, error, connect, disconnect }),
    [address, connecting, error, connect, disconnect]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet debe usarse dentro de WalletProvider')
  return ctx
}
