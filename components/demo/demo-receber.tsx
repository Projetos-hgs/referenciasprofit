// Contas a Receber — demo
'use client'

import { useState } from 'react'
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, ArrowDownCircle } from 'lucide-react'
import KpiCard from '@/components/ui/kpi-card'
import PageHeader from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const ENTRIES = [
  { id: '1', description: 'Serviços de Consultoria Jan/26', person_name: 'Cliente ABC Ltda', category: 'Serviços', expected_value: 28700, due_date: '2026-03-10', payment_date: null, status: 'open' },
  { id: '2', description: 'Nota Fiscal #1042', person_name: 'Distribuidora XYZ', category: 'Vendas', expected_value: 14350, due_date: '2026-02-28', payment_date: '2026-03-02', status: 'paid' },
  { id: '3', description: 'Mensalidade Software', person_name: 'TechCorp S.A.', category: 'Licenças', expected_value: 4800, due_date: '2026-02-15', payment_date: null, status: 'overdue' },
  { id: '4', description: 'Prestação de Serviços #77', person_name: 'Construtora Delta', category: 'Serviços', expected_value: 62000, due_date: '2026-03-20', payment_date: null, status: 'open' },
  { id: '5', description: 'Venda de Mercadorias', person_name: 'Varejista Omega', category: 'Vendas', expected_value: 9200, due_date: '2026-03-05', payment_date: '2026-03-05', status: 'paid' },
  { id: '6', description: 'Consultoria Tributária', person_name: 'Escritório Beta', category: 'Serviços', expected_value: 18500, due_date: '2026-02-20', payment_date: null, status: 'overdue' },
  { id: '7', description: 'Licença Anual Sistema', person_name: 'Cliente JK Ltda', category: 'Licenças', expected_value: 32400, due_date: '2026-04-01', payment_date: null, status: 'open' },
  { id: '8', description: 'Serviços de Marketing', person_name: 'Agência Foco', category: 'Serviços', expected_value: 11700, due_date: '2026-03-15', payment_date: null, status: 'open' },
]

type SortField = 'due_date' | 'expected_value' | 'person_name' | 'description'
type SortDir = 'asc' | 'desc'
type StatusFilter = '' | 'open' | 'paid' | 'overdue' | 'cancelled'

export default function DemoReceber() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')
  const [sortField, setSortField] = useState<SortField>('due_date')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-muted-foreground ml-1" />
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-primary ml-1" />
      : <ChevronDown className="w-3 h-3 text-primary ml-1" />
  }

  const filtered = ENTRIES
    .filter((e) => {
      if (status && e.status !== status) return false
      if (search) {
        const q = search.toLowerCase()
        return e.description.toLowerCase().includes(q) || e.person_name.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      let av: any = a[sortField], bv: any = b[sortField]
      if (sortField === 'expected_value') { av = Number(av); bv = Number(bv) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contas a Receber" description="Cliente: Empresa Alpha Ltda" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total em Aberto" value={formatCurrency(155100)} variant="info" icon={<ArrowDownCircle className="w-4 h-4" />} />
        <KpiCard title="Vencido" value={formatCurrency(23300)} variant="danger" />
        <KpiCard title="Recebido (mês)" value={formatCurrency(23550)} variant="success" />
        <KpiCard title="Total Geral" value={formatCurrency(181650)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, pessoa..."
            className="w-full bg-surface border border-border rounded text-foreground placeholder:text-muted-foreground text-sm pl-10 pr-4 py-2 outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="bg-surface border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
        >
          <option value="">Todos os status</option>
          <option value="open">Em Aberto</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
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
                    Cliente <SortIcon field="person_name" />
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
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                  <td className="py-2.5 px-4 text-foreground max-w-[200px] truncate">{entry.description}</td>
                  <td className="py-2.5 px-4 text-muted-foreground max-w-[140px] truncate">{entry.person_name}</td>
                  <td className="py-2.5 px-4 text-muted-foreground hidden md:table-cell">{entry.category}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-foreground">{formatCurrency(entry.expected_value)}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground">{formatDate(entry.due_date)}</td>
                  <td className="py-2.5 px-4 text-right text-muted-foreground hidden lg:table-cell">{formatDate(entry.payment_date)}</td>
                  <td className="py-2.5 px-4 text-center"><StatusBadge status={entry.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{filtered.length} registro(s)</span>
        </div>
      </div>
    </div>
  )
}
