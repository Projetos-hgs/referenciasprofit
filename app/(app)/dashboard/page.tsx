// Dashboard — BPO Financeiro
'use client'

import { useClientContext } from '@/lib/client-context'
import useSWR from 'swr'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
} from 'lucide-react'
import KpiCard from '@/components/ui/kpi-card'
import PageHeader from '@/components/ui/page-header'
import EmptyState from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getMonthLabel } from '@/lib/utils'
import type { FinancialEntry } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

export default function DashboardPage() {
  const { selectedClient } = useClientContext()

  const { data: summary, isLoading: summaryLoading } = useSWR(
    selectedClient ? `/api/dashboard/summary?clientId=${selectedClient.id}` : null,
    fetcher
  )

  const { data: cashflow, isLoading: cashflowLoading } = useSWR(
    selectedClient ? `/api/dashboard/cashflow?clientId=${selectedClient.id}` : null,
    fetcher
  )

  const { data: overdue, isLoading: overdueLoading } = useSWR(
    selectedClient ? `/api/dashboard/overdue?clientId=${selectedClient.id}` : null,
    fetcher
  )

  if (!selectedClient) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<Wallet className="w-6 h-6" />}
          title="Nenhum cliente selecionado"
          description="Selecione um cliente no seletor acima para ver o dashboard financeiro."
        />
      </div>
    )
  }

  const s = summary ?? {}
  const overdueList: FinancialEntry[] = overdue?.entries ?? []
  const chartData = cashflow?.months ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Dashboard — ${selectedClient.name}`}
        description="Visão geral financeira do cliente selecionado"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="A Receber (em aberto)"
          value={formatCurrency(s.totalReceivable ?? 0)}
          icon={<ArrowDownCircle className="w-4 h-4" />}
          variant="success"
          loading={summaryLoading}
        />
        <KpiCard
          title="A Pagar (em aberto)"
          value={formatCurrency(s.totalPayable ?? 0)}
          icon={<ArrowUpCircle className="w-4 h-4" />}
          variant="danger"
          loading={summaryLoading}
        />
        <KpiCard
          title="Vencidos a Receber"
          value={formatCurrency(s.overdueReceivable ?? 0)}
          icon={<AlertCircle className="w-4 h-4" />}
          variant="warning"
          loading={summaryLoading}
        />
        <KpiCard
          title="Resultado Líquido (mês)"
          value={formatCurrency(s.netResult ?? 0)}
          icon={<Activity className="w-4 h-4" />}
          variant={s.netResult >= 0 ? 'success' : 'danger'}
          loading={summaryLoading}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Fluxo de caixa - área */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Fluxo de Caixa — Últimos 6 meses</h3>
          {cashflowLoading ? (
            <div className="h-56 bg-surface-2 rounded animate-pulse" />
          ) : chartData.length === 0 ? (
            <EmptyState title="Sem dados" description="Sincronize o cliente para ver o gráfico." className="py-10" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
          )}
        </div>

        {/* Recebimentos vs pagamentos - barras */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Previsto vs Realizado</h3>
          {cashflowLoading ? (
            <div className="h-56 bg-surface-2 rounded animate-pulse" />
          ) : chartData.length === 0 ? (
            <EmptyState title="Sem dados" description="Sincronize o cliente para ver o gráfico." className="py-10" />
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
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
          )}
        </div>
      </div>

      {/* Vencidos */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Títulos Vencidos</h3>
          <span className="text-xs text-muted-foreground">{overdueList.length} registro(s)</span>
        </div>

        {overdueLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />
            ))}
          </div>
        ) : overdueList.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-5 h-5" />}
            title="Nenhum título vencido"
            description="Ótimo! Não há títulos vencidos para este cliente."
            className="py-8"
          />
        ) : (
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
                {overdueList.slice(0, 10).map((entry: FinancialEntry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                    <td className="py-2 px-3 text-foreground truncate max-w-[180px]">
                      {entry.description ?? '-'}
                    </td>
                    <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]">
                      {entry.person_name ?? '-'}
                    </td>
                    <td className="py-2 px-3">
                      <span className={entry.type === 'receivable' ? 'text-success text-xs' : 'text-danger text-xs'}>
                        {entry.type === 'receivable' ? 'Receber' : 'Pagar'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-foreground">
                      {formatCurrency(entry.expected_value)}
                    </td>
                    <td className="py-2 px-3 text-right text-muted-foreground">
                      {formatDate(entry.due_date)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
