'use client'

import { useState } from 'react'
import DemoSidebar from '@/components/demo/demo-sidebar'
import DemoHeader from '@/components/demo/demo-header'
import DemoDashboard from '@/components/demo/demo-dashboard'
import DemoReceber from '@/components/demo/demo-receber'
import DemoPagar from '@/components/demo/demo-pagar'
import DemoFluxo from '@/components/demo/demo-fluxo'
import DemoClientes from '@/components/demo/demo-clientes'

export type DemoPage = 'dashboard' | 'receber' | 'pagar' | 'fluxo' | 'clientes'

export default function DemoPage() {
  const [activePage, setActivePage] = useState<DemoPage>('dashboard')

  return (
    <div className="flex h-screen overflow-hidden">
      <DemoSidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DemoHeader />
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          {activePage === 'dashboard' && <DemoDashboard />}
          {activePage === 'receber' && <DemoReceber />}
          {activePage === 'pagar' && <DemoPagar />}
          {activePage === 'fluxo' && <DemoFluxo />}
          {activePage === 'clientes' && <DemoClientes />}
        </main>
      </div>
    </div>
  )
}
