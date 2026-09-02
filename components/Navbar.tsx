'use client'

import { useState } from 'react'
import Link from 'next/link'
import { List, X } from '@phosphor-icons/react'
import { TrikeLogo } from './TrikeLogo'
import { WalletButton } from './WalletButton'

const links = [
  { href: '/cuenta', label: 'Cuenta protegida' },
  { href: '/guardian', label: 'Guardián' },
  { href: '/reportar', label: 'Reportar cuenta' },
  { href: '/dashboard', label: 'Dashboard' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg focus-visible:outline-none">
          <TrikeLogo size={40} />
          <span className="font-heading text-2xl font-bold text-foreground">Trike</span>
        </Link>

        <nav className="hidden items-center gap-6 font-heading text-lg font-medium text-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-2 py-1 hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <WalletButton />
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground md:hidden"
        >
          {open ? <X size={28} weight="bold" /> : <List size={28} weight="bold" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-1 font-heading text-lg font-medium text-foreground">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3">
            <WalletButton />
          </div>
        </div>
      )}
    </header>
  )
}
