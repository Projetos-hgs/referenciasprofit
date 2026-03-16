// Header autenticado — BPO Financeiro
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, RefreshCw, LogOut, User, Building2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useClientContext } from '@/lib/client-context'
import { getPlatformLabel, getPlatformColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Client } from '@/lib/types'

export default function Header({ userEmail }: { userEmail?: string }) {
  const router = useRouter()
  const { clients, selectedClient, setSelectedClient, loading, refresh } = useClientContext()
  const [clientOpen, setClientOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  async function handleSync() {
    if (!selectedClient) return
    setSyncing(true)
    try {
      await fetch(`/api/sync/${selectedClient.platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient.id }),
      })
      refresh()
    } catch {
      // ignorar
    } finally {
      setSyncing(false)
    }
  }

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 gap-4 shrink-0">
      {/* Seletor de cliente */}
      <div className="relative" ref={clientRef}>
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-2 border border-border rounded hover:border-primary/50 transition-colors min-w-[200px]"
        >
          {loading ? (
            <span className="text-muted-foreground text-sm">Carregando...</span>
          ) : selectedClient ? (
            <>
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedClient.color ?? getPlatformColor(selectedClient.platform) }}
              />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{selectedClient.name}</p>
              </div>
              <span
                className="text-xs px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: getPlatformColor(selectedClient.platform) + '20',
                  color: getPlatformColor(selectedClient.platform),
                }}
              >
                {getPlatformLabel(selectedClient.platform)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Selecionar cliente</span>
          )}
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform ml-auto', clientOpen && 'rotate-180')} />
        </button>

        {clientOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-surface-2 border border-border rounded shadow-xl z-50 overflow-hidden">
            <div className="py-1 max-h-64 overflow-y-auto">
              {clients.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Nenhum cliente cadastrado
                </p>
              ) : (
                clients.map((client: Client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client)
                      setClientOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-surface transition-colors',
                      selectedClient?.id === client.id && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: client.color ?? getPlatformColor(client.platform) }}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      {client.cnpj && (
                        <p className="text-xs text-muted-foreground">{client.cnpj}</p>
                      )}
                    </div>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: getPlatformColor(client.platform) + '20',
                        color: getPlatformColor(client.platform),
                      }}
                    >
                      {getPlatformLabel(client.platform)}
                    </span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border py-1">
              <a
                href="/clientes"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                onClick={() => setClientOpen(false)}
              >
                <Plus className="w-4 h-4" />
                Adicionar cliente
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Ações direita */}
      <div className="flex items-center gap-2">
        {/* Sincronizar */}
        {selectedClient && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors',
              syncing && 'opacity-60 cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        )}

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', userOpen && 'rotate-180')} />
          </button>

          {userOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-surface-2 border border-border rounded shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-xs text-muted-foreground">Conectado como</p>
                <p className="text-sm font-medium text-foreground truncate">{userEmail ?? 'Usuário'}</p>
              </div>
              <div className="py-1">
                <a
                  href="/configuracoes"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  onClick={() => setUserOpen(false)}
                >
                  <Building2 className="w-4 h-4" />
                  Configurações
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-surface w-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
