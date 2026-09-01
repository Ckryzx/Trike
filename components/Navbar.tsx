import Link from 'next/link'
import { TrikeLogo } from './TrikeLogo'
import { WalletButton } from './WalletButton'

export function Navbar() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none">
          <TrikeLogo size={40} />
          <span className="font-heading text-2xl font-bold text-foreground">Trike</span>
        </Link>
        <nav className="flex items-center gap-6 font-heading text-lg font-medium text-foreground">
          <Link href="/cuenta" className="rounded-lg px-2 py-1 hover:text-primary">
            Cuenta protegida
          </Link>
          <Link href="/guardian" className="rounded-lg px-2 py-1 hover:text-primary">
            Guardián
          </Link>
        </nav>
        <WalletButton />
      </div>
    </header>
  )
}
