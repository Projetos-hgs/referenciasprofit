// KPI Card — componente de métricas
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
  loading?: boolean
}

export default function KpiCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  variant = 'default',
  loading = false,
}: KpiCardProps) {
  const variantBorder: Record<string, string> = {
    default: 'border-border',
    success: 'border-success/30',
    danger: 'border-danger/30',
    warning: 'border-warning/30',
    info: 'border-info/30',
  }

  const variantIcon: Record<string, string> = {
    default: 'bg-muted/20 text-muted-foreground',
    success: 'bg-success/15 text-success',
    danger: 'bg-danger/15 text-danger',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
  }

  return (
    <div
      className={cn(
        'bg-surface rounded-lg border p-4 flex flex-col gap-3',
        variantBorder[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', variantIcon[variant])}>
            {icon}
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-8 bg-surface-2 rounded animate-pulse w-32" />
      ) : (
        <p className="text-2xl font-bold text-foreground font-mono leading-none">{value}</p>
      )}

      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          {trend > 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          ) : trend < 0 ? (
            <TrendingDown className="w-3.5 h-3.5 text-danger" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted-foreground'
            )}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-muted-foreground">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}
