'use client'

import { useState } from 'react'
import { Search, ArrowUpCircle } from 'lucide-react'
import KpiCard from '@/components/ui/kpi-card'
import PageHeader from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

const ENTRIES = [
  { id: '1', description: 'Aluguel Sede Mar/26', person_name: 'Imóveis Premium SA', category: 'Ocupação', expected_value: 6200, due_date: '2026-03-05', payment_date: null, status: 'open' },
  { id: '2', description: 'Folha de Pagamento Fev', person_name: 'Funcionários', category: 'Pessoal', expected_value: 48000, due_date: '2026-02-28', payment_date: '2026-02-28', status: 'paid' },
  { id: '3', description: 'Mensalidade ERP', person_name: 'TechSoft Ltda', category: 'Tecnologia', expected_value: 3800, due_date: '2026-02-20', payment_date: null, status: 'overdue' },
  { id: '4', description: 'DARF IRPJ', person_name: 'Receita Federal', category: 'Impostos', expected_value: 15400, due_date: '2026-03-31', payment_date: null, status: 'open' },
  { id: '5', description: 'Energia Elétrica', person_name: 'CELG Distribuição', category: 'Utilidades', expected_value: 2150, due_date: '2026-03-15', payment_date: null, status: 'open' },
  { id: '6', description: 'Internet e Telefonia', person_name: 'Telecorp Telecom', category: 'Tecnologia', expected_value: 890, due_date: '2026-03-10', payment_date: '2026-03-10', status: 'paid' },
  { id: '7', description: 'Contador Externo Mar/26', person_name: 'Escritório Contábil XY', category: 'Serviços', expected_value: 4500, due_date: '2026-03-20', payment_date: null, status: 'open' },
]

type StatusFilter = '' | 'open' | 'paid' | 'overdue' | 'cancelled'

export default function DemoPagar() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('')

  const filtered = ENTRIES.filter((e) => {
    if (status && e.status !== status) return false
    if (search) {
      const q = search.toLowerCase()
      return e.description.toLowerCase().includes(q) || e.person_name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Contas a Pagar" description="Cliente: Empresa Alpha Ltda" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total em Aberto" value={formatCurrency(81940)} variant="danger" icon={<ArrowUpCircle className="w-4 h-4" />} />
        <KpiCard title="Vencido" value={formatCurrency(3800)} variant="warning" />
        <KpiCard title="Pago (mês)" value={formatCurrency(48890)} variant="success" />
        <KpiCard title="Total Geral" value={formatCurrency(80940)} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição, fornecedor..."
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
        </select>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 border-b border-border">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Fornecedor</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Valor</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground">Vencimento</th>
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
        <div className="px-4 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{filtered.length} registro(s)</span>
        </div>
      </div>
    </div>
  )
}
