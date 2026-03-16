'use client'

import { useState } from 'react'
import { useClientContext } from '@/lib/client-context'
import useSWR, { mutate } from 'swr'
import { BarChart3, Plus, GripVertical, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DreConfig, DreLineType } from '@/lib/types'
import EmptyState from '@/components/ui/empty-state'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const LINE_TYPES: { value: DreLineType; label: string; color: string }[] = [
  { value: 'revenue', label: 'Receita', color: 'text-success' },
  { value: 'deduction', label: 'Dedução', color: 'text-warning' },
  { value: 'cost', label: 'Custo', color: 'text-danger' },
  { value: 'expense', label: 'Despesa', color: 'text-danger' },
  { value: 'subtotal', label: 'Subtotal', color: 'text-info' },
  { value: 'total', label: 'Total', color: 'text-primary' },
]

const DEFAULT_LINE: Omit<DreConfig, 'id' | 'client_id' | 'created_at'> = {
  line_order: 0,
  line_label: '',
  line_type: 'revenue',
  category_codes: [],
  formula: null,
  is_bold: false,
}

export default function DreConfigTab() {
  const { selectedClient } = useClientContext()
  const [showAdd, setShowAdd] = useState(false)
  const [newLine, setNewLine] = useState<typeof DEFAULT_LINE>({ ...DEFAULT_LINE })
  const [codesInput, setCodesInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingAll, setSavingAll] = useState(false)
  const [error, setError] = useState('')

  const { data } = useSWR(
    selectedClient ? `/api/configuracoes/dre?clientId=${selectedClient.id}` : null,
    fetcher
  )
  const lines: DreConfig[] = data?.lines ?? []

  async function addLine() {
    if (!selectedClient || !newLine.line_label.trim()) { setError('Nome da linha é obrigatório'); return }
    setSaving(true)
    setError('')
    const codes = codesInput.split(',').map((s) => s.trim()).filter(Boolean)
    const res = await fetch('/api/configuracoes/dre', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: selectedClient.id,
        line: { ...newLine, line_order: lines.length + 1, category_codes: codes },
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); setSaving(false); return }
    mutate(`/api/configuracoes/dre?clientId=${selectedClient.id}`)
    setNewLine({ ...DEFAULT_LINE })
    setCodesInput('')
    setShowAdd(false)
    setSaving(false)
  }

  async function deleteLine(id: string) {
    if (!confirm('Remover esta linha do DRE?')) return
    await fetch('/api/configuracoes/dre', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    mutate(`/api/configuracoes/dre?clientId=${selectedClient?.id}`)
  }

  async function moveOrder(index: number, direction: 'up' | 'down') {
    const newLines = [...lines]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newLines.length) return
    ;[newLines[index], newLines[targetIndex]] = [newLines[targetIndex], newLines[index]]
    setSavingAll(true)
    await fetch('/api/configuracoes/dre', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: selectedClient?.id,
        order: newLines.map((l, i) => ({ id: l.id, line_order: i + 1 })),
      }),
    })
    mutate(`/api/configuracoes/dre?clientId=${selectedClient?.id}`)
    setSavingAll(false)
  }

  if (!selectedClient) {
    return (
      <div className="bg-surface border border-border rounded-xl">
        <EmptyState
          icon={<BarChart3 className="w-5 h-5" />}
          title="Nenhum cliente selecionado"
          description="Selecione um cliente no cabeçalho para configurar o DRE."
          className="py-16"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure as linhas do DRE para <strong className="text-foreground">{selectedClient.name}</strong>.
            Mapeie cada linha para os códigos de categoria da plataforma <strong className="text-foreground">{selectedClient.platform}</strong>.
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setError('') }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar linha
        </button>
      </div>

      {/* Formulário de nova linha */}
      {showAdd && (
        <div className="bg-surface border border-primary/30 rounded-xl p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-foreground">Nova linha DRE</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Nome da linha *</label>
              <input
                value={newLine.line_label}
                onChange={(e) => setNewLine({ ...newLine, line_label: e.target.value })}
                placeholder="Ex: Receita Bruta"
                className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
              <select
                value={newLine.line_type}
                onChange={(e) => setNewLine({ ...newLine, line_type: e.target.value as DreLineType })}
                className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
              >
                {LINE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">
              Códigos de categoria <span className="text-muted-foreground">(separados por vírgula)</span>
            </label>
            <input
              value={codesInput}
              onChange={(e) => setCodesInput(e.target.value)}
              placeholder="Ex: 1.1.01, 1.1.02, vendas_produto"
              className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors font-mono"
            />
          </div>
          {(newLine.line_type === 'subtotal' || newLine.line_type === 'total') && (
            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Fórmula <span className="text-muted-foreground">(ex: receita_bruta - deducoes)</span>
              </label>
              <input
                value={newLine.formula ?? ''}
                onChange={(e) => setNewLine({ ...newLine, formula: e.target.value || null })}
                placeholder="receita_bruta - deducoes - custos"
                className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_bold"
              checked={newLine.is_bold}
              onChange={(e) => setNewLine({ ...newLine, is_bold: e.target.checked })}
              className="accent-primary"
            />
            <label htmlFor="is_bold" className="text-xs text-muted-foreground">Exibir em negrito</label>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button onClick={addLine} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Salvando...' : 'Salvar linha'}
            </button>
          </div>
        </div>
      )}

      {/* Lista de linhas */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {lines.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="w-5 h-5" />}
            title="Nenhuma linha configurada"
            description="Adicione linhas para montar a estrutura do DRE deste cliente."
            className="py-14"
          />
        ) : (
          <ul className="divide-y divide-border">
            {lines.map((line, i) => {
              const typeInfo = LINE_TYPES.find((t) => t.value === line.line_type)
              const isSubtotal = line.line_type === 'subtotal' || line.line_type === 'total'
              return (
                <li key={line.id} className={cn('flex items-center gap-3 px-4 py-3', isSubtotal && 'bg-surface-2')}>
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm', line.is_bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                        {line.line_label}
                      </span>
                      {typeInfo && (
                        <span className={cn('text-xs', typeInfo.color)}>{typeInfo.label}</span>
                      )}
                    </div>
                    {line.category_codes && line.category_codes.length > 0 && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        {line.category_codes.join(', ')}
                      </p>
                    )}
                    {line.formula && (
                      <p className="text-xs text-info font-mono mt-0.5 truncate">= {line.formula}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => moveOrder(i, 'up')} disabled={i === 0 || savingAll} className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveOrder(i, 'down')} disabled={i === lines.length - 1 || savingAll} className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteLine(line.id)} className="p-1.5 rounded text-muted-foreground hover:text-danger transition-colors ml-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
