'use client'

import { useState } from 'react'
import { useClientContext } from '@/lib/client-context'
import useSWR from 'swr'
import PageHeader from '@/components/ui/page-header'
import EmptyState from '@/components/ui/empty-state'
import { formatCurrency, getMonthLabel } from '@/lib/utils'
import { BarChart3, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const YEAR_OPTIONS = [2024, 2025, 2026]

export default function DrePage() {
  const { selectedClient } = useClientContext()
  const [year, setYear] = useState(new Date().getFullYear())

  const { data, isLoading } = useSWR(
    selectedClient ? `/api/relatorios/dre?clientId=${selectedClient.id}&year=${year}` : null,
    fetcher
  )

  const rows = data?.rows ?? []
  const months = data?.months ?? Array.from({ length: 12 }, (_, i) => i + 1)

  function exportCsv() {
    if (!rows.length) return
    const header = ['Linha', ...months.map((m: number) => getMonthLabel(m)), 'Total']
    const csvRows = [header, ...rows.map((r: any) => [
      r.label,
      ...months.map((m: number) => r.values?.[m] ?? 0),
      r.total ?? 0,
    ])]
    const csv = csvRows.map((r) => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `DRE_${selectedClient?.name ?? 'cliente'}_${year}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="DRE — Demonstrativo de Resultados"
        description={selectedClient ? `Cliente: ${selectedClient.name}` : 'Selecione um cliente'}
      >
        <div className="flex gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-surface border border-border rounded text-foreground text-sm px-3 py-1.5 outline-none focus:border-primary transition-colors"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={!rows.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </PageHeader>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-10 bg-surface-2 rounded animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-5 h-5" />}
            title="DRE não configurada"
            description="Configure o mapeamento DRE nas configurações do cliente para gerar este relatório."
            className="py-16"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-surface-2 border-b border-border sticky top-0">
                <tr>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground min-w-[200px]">Linha</th>
                  {months.map((m: number) => (
                    <th key={m} className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {getMonthLabel(m)}
                    </th>
                  ))}
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, i: number) => {
                  const isSubtotal = row.type === 'subtotal' || row.type === 'total'
                  return (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border/50 transition-colors',
                        isSubtotal ? 'bg-surface-2' : 'hover:bg-surface-2',
                      )}
                    >
                      <td
                        className={cn(
                          'py-2.5 px-4',
                          row.isBold || isSubtotal ? 'font-semibold text-foreground' : 'text-muted-foreground pl-7'
                        )}
                      >
                        {row.label}
                      </td>
                      {months.map((m: number) => {
                        const val = row.values?.[m] ?? 0
                        return (
                          <td
                            key={m}
                            className={cn(
                              'py-2.5 px-3 text-right font-mono text-xs',
                              isSubtotal ? 'font-semibold' : '',
                              val < 0 ? 'text-danger' : val > 0 ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          >
                            {val !== 0 ? formatCurrency(val) : '-'}
                          </td>
                        )
                      })}
                      <td
                        className={cn(
                          'py-2.5 px-4 text-right font-mono text-xs font-semibold',
                          (row.total ?? 0) < 0 ? 'text-danger' : 'text-foreground'
                        )}
                      >
                        {formatCurrency(row.total ?? 0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
