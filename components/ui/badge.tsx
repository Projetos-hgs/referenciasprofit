import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted'
  className?: string
}

const variants: Record<string, string> = {
  default: 'bg-surface-2 text-foreground',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  muted: 'bg-muted/20 text-muted-foreground',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    open:      { label: 'Em Aberto', cls: 'bg-info/10 text-info' },
    paid:      { label: 'Pago',      cls: 'bg-success/10 text-success' },
    overdue:   { label: 'Vencido',   cls: 'bg-danger/10 text-danger' },
    cancelled: { label: 'Cancelado', cls: 'bg-muted/20 text-muted-foreground' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-muted/20 text-muted-foreground' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  )
}
