'use client'

import { useState } from 'react'
import { useClientContext } from '@/lib/client-context'
import PageHeader from '@/components/ui/page-header'
import { cn } from '@/lib/utils'
import IntegracoeTab from './tabs/integracoes'
import UsuariosTab from './tabs/usuarios'
import DreConfigTab from './tabs/dre-config'
import { Plug, Users, BarChart3 } from 'lucide-react'

const TABS = [
  { id: 'integracoes', label: 'Integrações', icon: Plug },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'dre', label: 'Config. DRE', icon: BarChart3 },
]

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('integracoes')
  const { selectedClient } = useClientContext()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description={selectedClient ? `Cliente: ${selectedClient.name}` : 'Selecione um cliente para configurar integrações e DRE'}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div>
        {activeTab === 'integracoes' && <IntegracoeTab />}
        {activeTab === 'usuarios' && <UsuariosTab />}
        {activeTab === 'dre' && <DreConfigTab />}
      </div>
    </div>
  )
}
