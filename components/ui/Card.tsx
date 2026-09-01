import { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ${className}`}
      {...props}
    />
  )
}
