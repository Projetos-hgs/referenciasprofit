'use client'

import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import PageHeader from '@/components/ui/page-header'
import KpiCard from '@/components/ui/kpi-card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS_6 = [
  { label: 'Out/25', received: 82000, paid: 64000 },
  { label: 'Nov/25', received: 95000, paid: 71000 },
  { label: 'Dez/25', received: 78000, paid: 68000 },
  { label: 'Jan/26', received: 105000, paid: 73000 },
  { label: 'Fev/26', received: 91000, paid: 66000 },
  { label: 'Mar/26', received: 118000, paid: 82000 },
]

const MONTHS_12 = [
  { label: 'Abr/25', received: 71000, paid: 58000 },
  { label: 'Mai/25', received: 76000, paid: 61000 },
  { label: 'Jun/25', received: 83000, paid: 65000 },
  { label: 'Jul/25', received: 79000, paid: 62000 },
  { label: 'Ago/25', received: 88000, paid: 67000 },
  { label: 'Set/25', received: 92000, paid: 70000 },
  ...MONTHS_6,
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const saldo = (payload[0]?.value ?? 0) - (payload[1]?.value ?? 0)
  return (
    <div className="bg-surface-2 border border-border rounded p-3 text-sm shadow-xl min-w-[180px]">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono" style={{ color: p.color }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t border-border mt-2 pt-2">
        <span className="text-muted-foreground">Saldo</span>
        <span className={cn('font-mono font-semibold', saldo >= 0 ? 'text-success' : 'text-danger')}>
          {formatCurrency(saldo)}
        </span>
      </div>
    </div>
  )
}

export default function DemoFluxo() {
  const [months, setMonths] = useState('6')
  const chartData = months === '6' ? MONTHS_6 : MONTHS_12

  const totalReceived = chartData.reduce((s, m) => s + m.received, 0)
  const totalPaid = chartData.reduce((s, m) => s + m.paid, 0)
  const netBalance = totalReceived - totalPaid

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Fluxo de Caixa" description="Cliente: Empresa Alpha Ltda">
        <div className="flex gap-1 bg-surface-2 border border-border rounded p-1">
          {[{ value: '6', label: '6 meses' }, { value: '12', label: '12 meses' }].map((o) => (
            <button
              key={o.value}
              onClick={() => setMonths(o.value)}
              className={cn(
                'px-3 py-1 text-xs rounded transition-colors',
                months === o.value
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Recebido" value={formatCurrency(totalReceived)} variant="success" icon={<TrendingUp className="w-4 h-4" />} />
        <KpiCard title="Total Pago" value={formatCurrency(totalPaid)} variant="danger" icon={<TrendingDown className="w-4 h-4" />} />
        <KpiCard title="Resultado Período" value={formatCurrency(netBalance)} variant={netBalance >= 0 ? 'success' : 'danger'} />
        <KpiCard title="Média Mensal" value={formatCurrency(netBalance / chartData.length)} variant="info" />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Entradas e Saídas Mensais</h3>
        <ResponsiveContainer width="100%" height={288}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="recGrad3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145,60%,42%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145,60%,42%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pagGrad3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(355,72%,54%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(355,72%,54%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5%,18%)" />
            <XAxis dataKey="label" tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(240,5%,30%)" />
            <Area type="monotone" dataKey="received" name="Recebido" stroke="hsl(145,60%,42%)" fill="url(#recGrad3)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="paid" name="Pago" stroke="hsl(355,72%,54%)" fill="url(#pagGrad3)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="bg-surface-2 border-b border-border">
          <div className="grid grid-cols-5 text-xs font-medium text-muted-foreground px-4 py-2.5">
            <span>Mês</span>
            <span className="text-right">Recebido</span>
            <span className="text-right">Pago</span>
            <span className="text-right">Saldo</span>
            <span className="text-right">Acumulado</span>
          </div>
        </div>
        <div>
          {chartData.map((m, i) => {
            const saldo = m.received - m.paid
            const acumulado = chartData.slice(0, i + 1).reduce((s, mm) => s + (mm.received - mm.paid), 0)
            return (
              <div key={m.label} className="grid grid-cols-5 text-sm px-4 py-2.5 border-b border-border/50 hover:bg-surface-2 transition-colors">
                <span className="text-muted-foreground font-medium">{m.label}</span>
                <span className="text-right font-mono text-success">{formatCurrency(m.received)}</span>
                <span className="text-right font-mono text-danger">{formatCurrency(m.paid)}</span>
                <span className={cn('text-right font-mono font-semibold', saldo >= 0 ? 'text-success' : 'text-danger')}>
                  {formatCurrency(saldo)}
                </span>
                <span className={cn('text-right font-mono', acumulado >= 0 ? 'text-foreground' : 'text-danger')}>
                  {formatCurrency(acumulado)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
