'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

interface ClientContextValue {
  clients: Client[]
  selectedClient: Client | null
  setSelectedClient: (client: Client | null) => void
  loading: boolean
  refresh: () => void
}

const ClientContext = createContext<ClientContextValue>({
  clients: [],
  selectedClient: null,
  setSelectedClient: () => {},
  loading: true,
  refresh: () => {},
})

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name')

      const list = (data as Client[]) ?? []
      setClients(list)

      // Restaurar cliente selecionado do localStorage
      const saved = localStorage.getItem('bpo_selected_client')
      if (saved) {
        const found = list.find((c) => c.id === saved)
        if (found) setSelectedClient(found)
        else if (list.length > 0) setSelectedClient(list[0])
      } else if (list.length > 0) {
        setSelectedClient(list[0])
      }

      setLoading(false)
    }
    fetchClients()
  }, [tick])

  function handleSetSelectedClient(client: Client | null) {
    setSelectedClient(client)
    if (client) localStorage.setItem('bpo_selected_client', client.id)
    else localStorage.removeItem('bpo_selected_client')
  }

  return (
    <ClientContext.Provider
      value={{
        clients,
        selectedClient,
        setSelectedClient: handleSetSelectedClient,
        loading,
        refresh: () => setTick((t) => t + 1),
      }}
    >
      {children}
    </ClientContext.Provider>
  )
}

export function useClientContext() {
  return useContext(ClientContext)
}
