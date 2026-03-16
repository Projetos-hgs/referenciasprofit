'use client'

import { useState } from 'react'
import { useClientContext } from '@/lib/client-context'
import useSWR, { mutate } from 'swr'
import { getPlatformLabel } from '@/lib/utils'
import { Plug, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PLATFORM_FIELDS: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
  omie: [
    { key: 'app_key', label: 'App Key', type: 'text', placeholder: 'Sua App Key do Omie' },
    { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Seu App Secret do Omie' },
  ],
  conta_azul: [
    { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'OAuth Client ID' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'OAuth Client Secret' },
  ],
  nibo: [
    { key: 'api_token', label: 'API Token', type: 'password', placeholder: 'Token de acesso da API Nibo' },
  ],
}

const PLATFORM_COLORS: Record<string, string> = {
  omie: 'text-blue-400',
  conta_azul: 'text-cyan-400',
  nibo: 'text-orange-400',
}

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    omie: 'bg-blue-400',
    conta_azul: 'bg-cyan-400',
    nibo: 'bg-orange-400',
  }
  return <span className={cn('w-2 h-2 rounded-full shrink-0', colors[platform] ?? 'bg-muted')} />
}

export default function IntegracoeTab() {
  const { selectedClient } = useClientContext()
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successes, setSuccesses] = useState<Record<string, boolean>>({})

  const { data } = useSWR(
    selectedClient ? `/api/configuracoes/integracoes?clientId=${selectedClient.id}` : null,
    fetcher
  )

  const credentials = data?.credentials ?? {}

  function getFormValue(platform: string, key: string): string {
    return forms[platform]?.[key] ?? credentials[platform]?.[key] ?? ''
  }

  function setField(platform: string, key: string, value: string) {
    setForms((prev) => ({ ...prev, [platform]: { ...(prev[platform] ?? {}), [key]: value } }))
    setSuccesses((prev) => ({ ...prev, [platform]: false }))
  }

  async function saveCredentials(platform: string) {
    if (!selectedClient) return
    setSaving(platform)
    setErrors((prev) => ({ ...prev, [platform]: '' }))
    const fields = PLATFORM_FIELDS[platform] ?? []
    const creds: Record<string, string> = {}
    for (const f of fields) creds[f.key] = getFormValue(platform, f.key)

    const res = await fetch('/api/configuracoes/integracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClient.id, platform, credentials: creds }),
    })
    const json = await res.json()
    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [platform]: json.error ?? 'Erro ao salvar' }))
    } else {
      setSuccesses((prev) => ({ ...prev, [platform]: true }))
      mutate(`/api/configuracoes/integracoes?clientId=${selectedClient.id}`)
    }
    setSaving(null)
  }

  async function runSync(platform: string) {
    if (!selectedClient) return
    setSyncing(platform)
    await fetch(`/api/sync/${platform}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClient.id }),
    })
    setSyncing(null)
    mutate(`/api/configuracoes/integracoes?clientId=${selectedClient.id}`)
  }

  if (!selectedClient) {
    return (
      <div className="flex items-center justify-center py-20 bg-surface border border-border rounded-xl">
        <div className="text-center">
          <Plug className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Selecione um cliente no cabeçalho para configurar as integrações.</p>
        </div>
      </div>
    )
  }

  const platform = selectedClient.platform
  const fields = PLATFORM_FIELDS[platform] ?? []
  const hasCredentials = !!credentials[platform]
  const lastSync = data?.lastSync

  return (
    <div className="max-w-lg flex flex-col gap-4">
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-4">
        {/* Header da plataforma */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlatformDot platform={platform} />
            <span className={cn('font-semibold text-sm', PLATFORM_COLORS[platform] ?? 'text-foreground')}>
              {getPlatformLabel(platform)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {hasCredentials
              ? <><CheckCircle2 className="w-3.5 h-3.5 text-success" /><span className="text-xs text-success">Configurado</span></>
              : <><AlertCircle className="w-3.5 h-3.5 text-warning" /><span className="text-xs text-warning">Pendente</span></>
            }
          </div>
        </div>

        {lastSync && (
          <p className="text-xs text-muted-foreground">
            Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
          </p>
        )}

        {/* Campos */}
        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
              <div className="relative">
                <input
                  type={field.type === 'password' && !showSecrets[`${platform}_${field.key}`] ? 'password' : 'text'}
                  value={getFormValue(platform, field.key)}
                  onChange={(e) => setField(platform, field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 pr-9 outline-none focus:border-primary transition-colors font-mono"
                />
                {field.type === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowSecrets((p) => ({ ...p, [`${platform}_${field.key}`]: !p[`${platform}_${field.key}`] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showSecrets[`${platform}_${field.key}`]
                      ? <EyeOff className="w-3.5 h-3.5" />
                      : <Eye className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {errors[platform] && (
          <p className="text-xs text-danger flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />{errors[platform]}
          </p>
        )}
        {successes[platform] && (
          <p className="text-xs text-success flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />Credenciais salvas com sucesso!
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => saveCredentials(platform)}
            disabled={saving === platform}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving === platform ? 'Salvando...' : 'Salvar credenciais'}
          </button>
          {hasCredentials && (
            <button
              onClick={() => runSync(platform)}
              disabled={syncing === platform}
              className="flex items-center gap-1.5 px-4 py-2 bg-surface-2 border border-border text-muted-foreground hover:text-foreground rounded text-sm transition-colors disabled:opacity-60"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncing === platform && 'animate-spin')} />
              {syncing === platform ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          )}
        </div>
      </div>

      {/* Instrucoes da plataforma */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs font-medium text-foreground mb-2">Como obter as credenciais</p>
        {platform === 'omie' && (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Acesse app.omie.com.br e vá em Configurações</li>
            <li>Clique em API e crie um novo aplicativo</li>
            <li>Copie a App Key e o App Secret gerados</li>
          </ol>
        )}
        {platform === 'conta_azul' && (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Acesse o portal de desenvolvedores da ContaAzul</li>
            <li>Crie um aplicativo OAuth 2.0</li>
            <li>Copie o Client ID e o Client Secret</li>
          </ol>
        )}
        {platform === 'nibo' && (
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Acesse app.nibo.com.br e vá em Configurações</li>
            <li>Clique em API e gere um novo token</li>
            <li>Copie o token de acesso gerado</li>
          </ol>
        )}
      </div>
    </div>
  )
}
