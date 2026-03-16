'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, User, Building2, RefreshCw } from 'lucide-react'
import { cn, getPlatformLabel, getPlatformColor } from '@/lib/utils'

const DEMO_CLIENTS = [
  { id: '1', name: 'Empresa Alpha Ltda', platform: 'omie', color: '#0055FF', cnpj: '12.345.678/0001-99' },
  { id: '2', name: 'Beta Comércio S.A.', platform: 'conta_azul', color: '#00B1CC', cnpj: '98.765.432/0001-11' },
  { id: '3', name: 'Gamma Serviços ME', platform: 'nibo', color: '#FF6B00', cnpj: '11.222.333/0001-44' },
]

export default function DemoHeader() {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [clientOpen, setClientOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const selected = DEMO_CLIENTS[selectedIdx]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) setClientOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 gap-4 shrink-0">
      {/* Seletor de cliente */}
      <div className="relative" ref={clientRef}>
        <button
          onClick={() => setClientOpen(!clientOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 bg-surface-2 border border-border rounded hover:border-primary/50 transition-colors min-w-[220px]"
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{selected.name}</p>
          </div>
          <span
            className="text-xs px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: getPlatformColor(selected.platform) + '20',
              color: getPlatformColor(selected.platform),
            }}
          >
            {getPlatformLabel(selected.platform)}
          </span>
          <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform ml-auto', clientOpen && 'rotate-180')} />
        </button>

        {clientOpen && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-surface-2 border border-border rounded shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              {DEMO_CLIENTS.map((client, idx) => (
                <button
                  key={client.id}
                  onClick={() => { setSelectedIdx(idx); setClientOpen(false) }}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-surface transition-colors',
                    selectedIdx === idx && 'bg-primary/10 text-primary'
                  )}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color }} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.cnpj}</p>
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
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ações direita */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sincronizar</span>
        </button>

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
                <p className="text-sm font-medium text-foreground truncate">demo@bpofinanceiro.com</p>
              </div>
              <div className="py-1">
                <a
                  href="/auth/login"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Entrar com conta real
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
