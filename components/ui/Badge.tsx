import { ShieldCheck, ShieldWarning, Clock, XCircle } from '@phosphor-icons/react/ssr'
import type { RequestStatusLabel } from '@/lib/api-client'

const STATUS_STYLE: Record<RequestStatusLabel, { bg: string; fg: string; icon: JSX.Element; label: string }> = {
  Approved: {
    bg: 'bg-success-bg',
    fg: 'text-success-foreground',
    icon: <ShieldCheck size={18} weight="bold" aria-hidden="true" />,
    label: 'Aprobada',
  },
  PendingPrincipal: {
    bg: 'bg-warning-bg',
    fg: 'text-warning-foreground',
    icon: <Clock size={18} weight="bold" aria-hidden="true" />,
    label: 'Esperando guardián principal',
  },
  PendingSecondary: {
    bg: 'bg-warning-bg',
    fg: 'text-warning-foreground',
    icon: <Clock size={18} weight="bold" aria-hidden="true" />,
    label: 'Esperando guardián secundario',
  },
  Cancelled: {
    bg: 'bg-danger-bg',
    fg: 'text-danger-foreground',
    icon: <XCircle size={18} weight="bold" aria-hidden="true" />,
    label: 'Cancelada',
  },
}

export function StatusBadge({ status }: { status: RequestStatusLabel }) {
  const s = STATUS_STYLE[status]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${s.bg} ${s.fg}`}>
      {s.icon}
      {s.label}
    </span>
  )
}

export function RiskBadge({ risky }: { risky: boolean }) {
  return risky ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-warning-bg px-4 py-1.5 text-sm font-semibold text-warning-foreground">
      <ShieldWarning size={18} weight="bold" aria-hidden="true" />
      Requiere revisión
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-success-bg px-4 py-1.5 text-sm font-semibold text-success-foreground">
      <ShieldCheck size={18} weight="bold" aria-hidden="true" />
      Transferencia segura
    </span>
  )
}
