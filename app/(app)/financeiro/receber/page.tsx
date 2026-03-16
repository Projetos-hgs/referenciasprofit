'use client'

import { useState, useCallback } from 'react'
import { useClientContext } from '@/lib/client-context'
import useSWR from 'swr'
import { Search, Filter, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badge'
import PageHeader from '@/components/ui/page-header'
import KpiCard from '@/components/ui/kpi-card'
import EmptyState from '@/components/ui/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { FinancialEntry, EntryStatus } from '@/lib/types'
import { ArrowDownCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_OPTIONS: { value: EntryStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Em Aberto' },
  { value: 'paid', label: 'Pago' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' },
]

type SortField = 'due_date' | 'expected_value' | 'person_name' | 'description'
type SortDir = 'asc' | 'desc'

export default function ReceberPage() {
  const { selectedClient } = useClientContext()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<EntryStatus | ''>('')
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const params = new URLSearchParams({
    clientId: selectedClient?.id ?? '',
    type: 'receivable',
    ...(status && { status }),
    ...(search && { search }),
    sort: sortField,
    dir: sortDir,
    page: String(page),
    pageSize: String(pageSize),
  })

  const { data, isLoading } = useSWR(
    selectedClient ? `/api/financeiro/entries?${params}` : null,
    fetcher
  )

  const { data: kpis } = useSWR(
    selectedClient ? `/api/financeiro/kpis?clientId=${selectedClient.id}&type=receivable` : null,
    fetcher
  )

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary ml-1" />
      : <ChevronDown className="w-3 h-3 text-primary ml-1" />
  }, [sortField, sortDir])

  const entries: FinancialEntry[] = data?.entries ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contas a Receber"
        description={selectedClient ? `Cliente: ${selectedClient.name}` : 'Selecione um cliente'}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total em Aberto" value={formatCurrency(kpis?.open ?? 0)} variant="info" icon={<ArrowDownCircle className="w-4 h-4" />} />
        <KpiCard title="Vencido" value={formatCurrency(kpis?.overdue ?? 0)} variant="danger" />
        <KpiCard title="Recebido (mês)" value={formatCurrency(kpis?.paidMonth ?? 0)} variant="success" />
        <KpiCard title="Total Geral" value={formatCurrency(kpis?.total ?? 0)} />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por descrição, pessoa..."
            className="w-full bg-surface border border-border rounded text-foreground placeholder:text-muted-foreground text-sm pl-10 pr-4 py-2 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as EntryStatus | ''); setPage(1) }}
          className="bg-surface border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<ArrowDownCircle className="w-5 h-5" />}
            title="Nenhum título encontrado"
            description="Sincronize o cliente ou ajuste os filtros."
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                    <button onClick={() => toggleSort('description')} className="flex items-center hover:text-foreground">
                      Descrição <SortIcon field="description" />
                    </button>
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">
                    <button onClick={() => toggleSort('person_name')} className="flex items-center hover:text-foreground">
                      Pessoa <SortIcon field="person_name" />
                    </button>
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">
                    <button onClick={() => toggleSort('expected_value')} className="flex items-center justify-end hover:text-foreground ml-auto">
                      Valor <SortIcon field="expected_value" />
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">
                    <button onClick={() => toggleSort('due_date')} className="flex items-center justify-end hover:text-foreground ml-auto">
                      Vencimento <SortIcon field="due_date" />
                    </button>
                  </th>
                  <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Pgto.</th>
                  <th className="text-center py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                    <td className="py-2.5 px-4 text-foreground max-w-[180px] truncate">{entry.description ?? '-'}</td>
                    <td className="py-2.5 px-4 text-muted-foreground max-w-[140px] truncate">{entry.person_name ?? '-'}</td>
                    <td className="py-2.5 px-4 text-muted-foreground hidden md:table-cell truncate max-w-[120px]">{entry.category ?? '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-foreground">{formatCurrency(entry.expected_value)}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{formatDate(entry.due_date)}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground hidden lg:table-cell">{formatDate(entry.payment_date)}</td>
                    <td className="py-2.5 px-4 text-center"><StatusBadge status={entry.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {total} registro(s) — página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs bg-surface-2 border border-border rounded disabled:opacity-40 hover:border-primary/50 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs bg-surface-2 border border-border rounded disabled:opacity-40 hover:border-primary/50 transition-colors"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
