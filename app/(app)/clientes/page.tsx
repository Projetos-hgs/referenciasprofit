'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useClientContext } from '@/lib/client-context'
import PageHeader from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/badge'
import EmptyState from '@/components/ui/empty-state'
import { formatCNPJ, getPlatformLabel, getPlatformColor } from '@/lib/utils'
import type { Client } from '@/lib/types'
import {
  Users, Plus, Pencil, Trash2, RefreshCw, CheckCircle2, XCircle, Circle,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PLATFORM_OPTIONS = [
  { value: 'omie', label: 'Omie' },
  { value: 'conta_azul', label: 'ContaAzul' },
  { value: 'nibo', label: 'Nibo' },
]

const PLATFORM_COLORS: Record<string, string> = {
  omie: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  conta_azul: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  nibo: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

function PlatformChip({ platform }: { platform: string }) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', PLATFORM_COLORS[platform] ?? 'bg-muted/20 text-muted-foreground border-border')}>
      {getPlatformLabel(platform)}
    </span>
  )
}

interface ClientFormData {
  name: string
  cnpj: string
  platform: string
  color: string
}

const DEFAULT_FORM: ClientFormData = { name: '', cnpj: '', platform: 'omie', color: '#6c2894' }

export default function ClientesPage() {
  const { selectedClient, setSelectedClient } = useClientContext()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [error, setError] = useState('')

  const { data, isLoading } = useSWR<{ clients: Client[] }>('/api/clientes', fetcher)
  const clients = data?.clients ?? []

  function openCreate() {
    setEditing(null)
    setForm(DEFAULT_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({ name: client.name, cnpj: client.cnpj ?? '', platform: client.platform, color: client.color ?? '#6c2894' })
    setError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError('')
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...form, id: editing.id } : form
      const res = await fetch('/api/clientes', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar')
      mutate('/api/clientes')
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmar exclusão do cliente? Todos os dados financeiros serão removidos.')) return
    setDeleting(id)
    await fetch('/api/clientes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (selectedClient?.id === id) setSelectedClient(null)
    mutate('/api/clientes')
    setDeleting(null)
  }

  async function handleSync(client: Client) {
    setSyncing(client.id)
    try {
      await fetch(`/api/sync/${client.platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      })
    } finally {
      setSyncing(null)
      mutate('/api/clientes')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes do BPO e suas integrações"
      >
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </PageHeader>

      {/* Modal de formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Nome *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome da empresa"
                  className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">CNPJ</label>
                <input
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Plataforma *</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cor de identificação</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-9 rounded border border-border bg-surface-2 cursor-pointer p-0.5"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
                </div>
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid de clientes */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-surface border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl">
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="Nenhum cliente cadastrado"
            description="Crie o primeiro cliente para começar a gerenciar o BPO."
            className="py-20"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className={cn(
                'bg-surface border rounded-xl p-5 flex flex-col gap-4 transition-all',
                selectedClient?.id === client.id ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border hover:border-border/80'
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
                    {client.cnpj && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatCNPJ(client.cnpj)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {client.is_active
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <XCircle className="w-4 h-4 text-danger" />
                  }
                </div>
              </div>

              <div className="flex items-center gap-2">
                <PlatformChip platform={client.platform} />
              </div>

              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => setSelectedClient(client)}
                  className={cn(
                    'flex-1 py-1.5 text-xs rounded border transition-colors',
                    selectedClient?.id === client.id
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-surface-2 text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                  )}
                >
                  {selectedClient?.id === client.id ? 'Selecionado' : 'Selecionar'}
                </button>
                <button
                  onClick={() => handleSync(client)}
                  disabled={syncing === client.id}
                  title="Sincronizar dados"
                  className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', syncing === client.id && 'animate-spin')} />
                </button>
                <button
                  onClick={() => openEdit(client)}
                  title="Editar"
                  className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(client.id)}
                  disabled={deleting === client.id}
                  title="Excluir"
                  className="p-1.5 rounded border border-border text-muted-foreground hover:text-danger hover:border-danger/40 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
