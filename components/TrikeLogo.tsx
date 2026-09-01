'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface TrikeLogoProps {
  size?: number
  className?: string
}

// Placeholder de marca: triceratops mascota animado. El usuario reemplazará
// esto por un logo definitivo más adelante.
export function TrikeLogo({ size = 40, className }: TrikeLogoProps) {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(query.matches)
    const listener = (e: MediaQueryListEvent) => setReduceMotion(e.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo de Trike: triceratops"
    >
      <motion.g
        initial={false}
        animate={reduceMotion ? undefined : { y: [0, -1.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* frill */}
        <path
          d="M32 6C21 6 12 13 12 24C12 24 18 20 24 21C21 15 26 9 32 9C38 9 43 15 40 21C46 20 52 24 52 24C52 13 43 6 32 6Z"
          fill="var(--color-primary)"
        />
        <path
          d="M32 6C21 6 12 13 12 24C12 24 18 20 24 21C21 15 26 9 32 9C38 9 43 15 40 21C46 20 52 24 52 24C52 13 43 6 32 6Z"
          fill="var(--color-secondary)"
          opacity="0.3"
        />

        {/* tail */}
        <motion.path
          d="M46 46C50 47 54 45 55 41C52 43 48 43 46 41Z"
          fill="var(--color-primary)"
          initial={false}
          animate={reduceMotion ? undefined : { rotate: [0, 8, 0] }}
          style={{ transformOrigin: '46px 43px' }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* legs */}
        <rect x="21" y="47" width="7" height="9" rx="3" fill="var(--color-primary)" />
        <rect x="36" y="47" width="7" height="9" rx="3" fill="var(--color-primary)" />

        {/* body */}
        <ellipse cx="32" cy="42" rx="16" ry="11" fill="var(--color-primary)" />

        {/* head */}
        <ellipse cx="32" cy="27" rx="14" ry="12" fill="var(--color-primary)" />
        <ellipse cx="32" cy="32" rx="9" ry="6.5" fill="#ffffff" />

        {/* horns */}
        <path d="M23 19L20 11L27 17Z" fill="#ffffff" />
        <path d="M41 19L44 11L37 17Z" fill="#ffffff" />
        <path d="M32 24L32 17L36 23Z" fill="#ffffff" />

        {/* eyes (blink) */}
        <motion.g
          initial={false}
          animate={reduceMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
          style={{ transformOrigin: '32px 27px' }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.85, 0.9, 0.95], ease: 'easeInOut' }}
        >
          <circle cx="26" cy="27" r="2.2" fill="var(--color-primary)" />
          <circle cx="38" cy="27" r="2.2" fill="var(--color-primary)" />
        </motion.g>

        {/* smile */}
        <path
          d="M27 34C29 36 35 36 37 34"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
    </svg>
  )
}
