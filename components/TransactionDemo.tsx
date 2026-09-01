'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const DURATION = 5
const TIMES = [0, 0.35, 0.42, 0.48, 0.72, 0.85, 1]
const FLASH_TIMES = [0, 0.42, 0.48, 0.55, 1]

export function TransactionDemo() {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(query.matches)
    const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return (
    <div aria-hidden="true" className="relative mx-auto h-64 w-full max-w-xl px-4 sm:h-72">
      {/* dashed transaction line */}
      <div className="absolute left-[15%] right-[15%] top-[68%] h-0.5 -translate-y-1/2 border-t-2 border-dashed border-border" />

      {/* Titular + celular enviando la transferencia */}
      <div className="absolute left-[15%] top-[68%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        <svg width="56" height="68" viewBox="0 0 72 88" style={{ overflow: 'visible' }}>
          <motion.g
            initial={false}
            animate={reduceMotion ? undefined : { scale: [1, 1.08, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '36px 19px' }}
          >
            <rect x="24" y="0" width="24" height="38" rx="6" fill="var(--color-card)" stroke="var(--color-foreground)" strokeWidth="2" />
            <rect x="28" y="6" width="16" height="24" rx="2" fill="var(--color-muted)" />
            <path d="M36 24V12M30 18L36 12L42 18" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="36" cy="33" r="1.5" fill="var(--color-foreground)" />
          </motion.g>
          <circle cx="36" cy="52" r="10" fill="var(--color-foreground)" />
          <path d="M20 88C20 74 27 68 36 68C45 68 52 74 52 88Z" fill="var(--color-foreground)" />
        </svg>
        <span className="text-xs font-medium text-muted-foreground">Titular</span>
      </div>

      {/* Hacker */}
      <div className="absolute left-[85%] top-[68%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
        <motion.svg
          width="52"
          height="52"
          viewBox="0 0 64 64"
          initial={false}
          animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <path
            d="M32 6C18 6 10 18 10 30C10 38 14 42 14 42L20 34C20 34 16 28 20 20C23 14 28 12 32 12C36 12 41 14 44 20C48 28 44 34 44 34L50 42C50 42 54 38 54 30C54 18 46 6 32 6Z"
            fill="var(--color-destructive)"
          />
          <ellipse cx="32" cy="30" rx="9" ry="7" fill="#111827" />
          <circle cx="28" cy="30" r="1.6" fill="var(--color-destructive-foreground)" />
          <circle cx="36" cy="30" r="1.6" fill="var(--color-destructive-foreground)" />
          <path
            d="M18 42C18 54 24 62 32 62C40 62 46 54 46 42C46 42 40 46 32 46C24 46 18 42 18 42Z"
            fill="var(--color-destructive)"
          />
        </motion.svg>
        <span className="text-xs font-medium text-muted-foreground">Destino riesgoso</span>
      </div>

      {/* moneda viajando hacia el destino */}
      <motion.div
        className="absolute top-[68%] z-20 -translate-x-1/2 -translate-y-1/2"
        style={{ left: '15%' }}
        initial={false}
        animate={
          reduceMotion
            ? undefined
            : {
                left: ['15%', '50%', '50%', '50%', '15%', '15%', '15%'],
                opacity: [1, 1, 1, 0, 0, 0, 1],
              }
        }
        transition={{ duration: DURATION, repeat: Infinity, times: TIMES, ease: 'easeInOut' }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22">
          <circle cx="11" cy="11" r="10" fill="var(--color-accent)" />
          <text x="11" y="15" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff">
            $
          </text>
        </svg>
      </motion.div>

      {/* el guardian (triceratops) cae a bloquear la transaccion */}
      <motion.div
        className="absolute left-[50%] top-[68%] z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
        initial={false}
        animate={
          reduceMotion
            ? undefined
            : {
                y: [-90, -90, 8, 0, 0, -90, -90],
                opacity: [0, 0, 1, 1, 1, 0, 0],
                scale: [0.6, 0.6, 1.15, 1, 1, 0.85, 0.6],
              }
        }
        transition={{ duration: DURATION, repeat: Infinity, times: TIMES, ease: 'easeInOut' }}
      >
        <svg width="52" height="52" viewBox="0 0 64 64">
          <ellipse cx="32" cy="34" rx="20" ry="18" fill="var(--color-primary)" />
          <ellipse cx="32" cy="40" rx="13" ry="9" fill="#ffffff" />
          <path d="M18 24L13 12L24 20Z" fill="#ffffff" />
          <path d="M46 24L51 12L40 20Z" fill="#ffffff" />
          <path d="M32 30L32 20L38 28Z" fill="#ffffff" />
          <circle cx="24" cy="34" r="3" fill="var(--color-primary)" />
          <circle cx="40" cy="34" r="3" fill="var(--color-primary)" />
          <path d="M26 44C29 47 35 47 38 44" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M46 10V7C46 4.2 48.2 2 51 2C53.8 2 56 4.2 56 7V10" stroke="var(--color-accent)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="42" y="10" width="18" height="14" rx="3" fill="var(--color-accent)" />
          <circle cx="51" cy="16" r="2" fill="#ffffff" />
          <rect x="50" y="17" width="2" height="4" fill="#ffffff" />
        </svg>
        <span className="text-xs font-semibold text-primary">Guardián</span>
      </motion.div>

      {/* destello de bloqueo al impactar */}
      <motion.div
        className="absolute left-[50%] top-[68%] z-40 -translate-x-1/2 -translate-y-1/2"
        initial={false}
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0, 0, 1, 0, 0],
                scale: [0.5, 0.5, 1.3, 0.7, 0.5],
              }
        }
        transition={{ duration: DURATION, repeat: Infinity, times: FLASH_TIMES, ease: 'easeInOut' }}
      >
        <svg width="30" height="30" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="none" stroke="var(--color-destructive)" strokeWidth="3" />
          <line x1="6" y1="22" x2="22" y2="6" stroke="var(--color-destructive)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </motion.div>
    </div>
  )
}
