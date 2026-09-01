'use client'

import { motion } from 'framer-motion'
import { ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:brightness-110',
  secondary: 'bg-white text-primary border-2 border-primary hover:bg-muted',
  success: 'bg-accent text-accent-foreground hover:brightness-110',
  danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
  ghost: 'bg-transparent text-primary hover:bg-muted',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', disabled, children, ...props },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      disabled={disabled}
      className={`min-h-[44px] min-w-[44px] rounded-xl px-6 py-3 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  )
})
