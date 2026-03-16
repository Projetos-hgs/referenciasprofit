// Clientes — demo
'use client'

import { useState } from 'react'
import { Building2, CheckCircle2, RefreshCw, Pencil, Trash2, Plus } from 'lucide-react'
import PageHeader from '@/components/ui/page-header'
import { formatCNPJ, getPlatformLabel, getPlatformColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  omie: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  conta_azul: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  nibo: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const DEMO_CLIENTS = [
  { id: '1', name: 'Empresa Alpha Ltda', cnpj: '12345678000199', platform: 'omie', color: '#0055FF', is_active: true },
  { id: '2', name: 'Beta Comércio S.A.', cnpj: '98765432000111', platform: 'conta_azul', color: '#00B1CC', is_active: true },
  { id: '3', name: 'Gamma Serviços ME', cnpj: '11222333000144', platform: 'nibo', color: '#FF6B00', is_active: true },
  { id: '4', name: 'Delta Indústria Ltda', cnpj: '22333444000155', platform: 'omie', color: '#0055FF', is_active: false },
]

export default function DemoClientes() {
  const [selected, setSelected] = useState('1')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes do BPO e suas integrações"
      >
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEMO_CLIENTS.map((client) => (
          <div
            key={client.id}
            className={cn(
              'bg-surface border rounded-xl p-5 flex flex-col gap-4 transition-all',
              selected === client.id ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border hover:border-border/80'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${client.color}22`, border: `1px solid ${client.color}44` }}
                >
                  <Building2 className="w-5 h-5" style={{ color: client.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCNPJ(client.cnpj)}</p>
                </div>
              </div>
              <CheckCircle2 className={cn('w-4 h-4 shrink-0', client.is_active ? 'text-success' : 'text-muted-foreground')} />
            </div>

            <div>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PLATFORM_COLORS[client.platform])}>
                {getPlatformLabel(client.platform)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-auto">
              <button
                onClick={() => setSelected(client.id)}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded border transition-colors',
                  selected === client.id
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'bg-surface-2 text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                )}
              >
                {selected === client.id ? 'Selecionado' : 'Selecionar'}
              </button>
              <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded border border-border text-muted-foreground hover:text-danger hover:border-danger/40 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
