// Dashboard — demo
'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertCircle, Wallet,
  ArrowDownCircle, ArrowUpCircle, Activity,
} from 'lucide-react'
import KpiCard from '@/components/ui/kpi-card'
import PageHeader from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const CASHFLOW = [
  { label: 'Out', received: 82000, paid: 64000, expectedReceivable: 90000, expectedPayable: 70000 },
  { label: 'Nov', received: 95000, paid: 71000, expectedReceivable: 100000, expectedPayable: 75000 },
  { label: 'Dez', received: 78000, paid: 68000, expectedReceivable: 85000, expectedPayable: 70000 },
  { label: 'Jan', received: 105000, paid: 73000, expectedReceivable: 110000, expectedPayable: 78000 },
  { label: 'Fev', received: 91000, paid: 66000, expectedReceivable: 95000, expectedPayable: 72000 },
  { label: 'Mar', received: 118000, paid: 82000, expectedReceivable: 120000, expectedPayable: 85000 },
]

const OVERDUE = [
  { id: '1', description: 'Serviços de Consultoria', person_name: 'Fornecedor ABC', type: 'receivable', expected_value: 12500, due_date: '2026-02-15', payment_date: null, status: 'overdue' },
  { id: '2', description: 'Mensalidade Sistema ERP', person_name: 'TechSoft Ltda', type: 'payable', expected_value: 3800, due_date: '2026-02-20', payment_date: null, status: 'overdue' },
  { id: '3', description: 'Nota Fiscal #1042', person_name: 'Cliente XYZ', type: 'receivable', expected_value: 28700, due_date: '2026-02-28', payment_date: null, status: 'overdue' },
  { id: '4', description: 'Aluguel Sede', person_name: 'Imóveis SA', type: 'payable', expected_value: 6200, due_date: '2026-03-01', payment_date: null, status: 'overdue' },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded p-3 text-sm shadow-xl">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function DemoDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard — Empresa Alpha Ltda"
        description="Visão geral financeira do cliente selecionado"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="A Receber (em aberto)"
          value={formatCurrency(284750)}
          icon={<ArrowDownCircle className="w-4 h-4" />}
          variant="success"
        />
        <KpiCard
          title="A Pagar (em aberto)"
          value={formatCurrency(137900)}
          icon={<ArrowUpCircle className="w-4 h-4" />}
          variant="danger"
        />
        <KpiCard
          title="Vencidos a Receber"
          value={formatCurrency(41200)}
          icon={<AlertCircle className="w-4 h-4" />}
          variant="warning"
        />
        <KpiCard
          title="Resultado Líquido (mês)"
          value={formatCurrency(36000)}
          icon={<Activity className="w-4 h-4" />}
          variant="success"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo de Caixa — Últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={CASHFLOW} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145,60%,42%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(145,60%,42%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(355,72%,54%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(355,72%,54%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5%,18%)" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={56} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="received" name="Recebido" stroke="hsl(145,60%,42%)" fill="url(#recGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="paid" name="Pago" stroke="hsl(355,72%,54%)" fill="url(#pagGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Previsto vs Realizado</h3>
          <ResponsiveContainer width="100%" height={224}>
            <BarChart data={CASHFLOW} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240,5%,18%)" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(240,5%,60%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} width={56} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(240,5%,60%)' }} />
              <Bar dataKey="expectedReceivable" name="Prev. Receber" fill="hsl(145,60%,42%)" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
              <Bar dataKey="received" name="Recebido" fill="hsl(145,60%,42%)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expectedPayable" name="Prev. Pagar" fill="hsl(355,72%,54%)" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
              <Bar dataKey="paid" name="Pago" fill="hsl(355,72%,54%)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vencidos */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Títulos Vencidos</h3>
          <span className="text-xs text-muted-foreground">{OVERDUE.length} registro(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Pessoa</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Valor</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Vencimento</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {OVERDUE.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                  <td className="py-2 px-3 text-foreground truncate max-w-[180px]">{entry.description}</td>
                  <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]">{entry.person_name}</td>
                  <td className="py-2 px-3">
                    <span className={entry.type === 'receivable' ? 'text-success text-xs' : 'text-danger text-xs'}>
                      {entry.type === 'receivable' ? 'Receber' : 'Pagar'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-foreground">{formatCurrency(entry.expected_value)}</td>
                  <td className="py-2 px-3 text-right text-muted-foreground">{formatDate(entry.due_date)}</td>
                  <td className="py-2 px-3 text-center"><StatusBadge status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
