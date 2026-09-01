'use client'

import { useWallet } from '@/lib/wallet-context'
import { Button } from './ui/Button'

function truncate(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function WalletButton() {
  const { address, connecting, error, connect, disconnect } = useWallet()

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground sm:inline">
          {truncate(address)}
        </span>
        <Button variant="ghost" onClick={disconnect} className="text-sm">
          Desconectar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={connect} disabled={connecting}>
        {connecting ? 'Conectando...' : 'Conectar Freighter'}
      </Button>
      {error && <span className="max-w-xs text-right text-sm text-destructive">{error}</span>}
    </div>
  )
}
