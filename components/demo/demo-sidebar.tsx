'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown as ChevronDownIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DemoPage } from '@/app/demo/page'

interface DemoSidebarProps {
  activePage: DemoPage
  onNavigate: (page: DemoPage) => void
}

const NAV = [
  { id: 'dashboard' as DemoPage, label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Financeiro',
    icon: TrendingUp,
    children: [
      { id: 'receber' as DemoPage, label: 'Contas a Receber', icon: ArrowDownCircle },
      { id: 'pagar' as DemoPage, label: 'Contas a Pagar', icon: ArrowUpCircle },
      { id: 'fluxo' as DemoPage, label: 'Fluxo de Caixa', icon: TrendingUp },
    ],
  },
  { id: 'clientes' as DemoPage, label: 'Clientes', icon: Users },
]

export default function DemoSidebar({ activePage, onNavigate }: DemoSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState(['Financeiro'])

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

  const childPages: DemoPage[] = ['receber', 'pagar', 'fluxo']
  const isFinanceiroActive = childPages.includes(activePage)

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-surface border-r border-border transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="font-bold text-primary-foreground text-sm font-sans">P</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-sm truncate">BPO Financeiro</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV.map((item) => {
          if ('children' in item) {
            const isOpen = openGroups.includes(item.label)
            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.label)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                    isFinanceiroActive
                      ? 'text-foreground bg-surface-2'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDownIcon
                        className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-180')}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="pl-3">
                    {item.children.map((child) => {
                      const active = activePage === child.id
                      return (
                        <button
                          key={child.id}
                          onClick={() => onNavigate(child.id)}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors w-full border-l ml-2',
                            active
                              ? 'text-primary border-primary bg-primary/5'
                              : 'text-muted-foreground hover:text-foreground border-border hover:border-muted'
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm transition-colors w-full',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Demo banner */}
      {!collapsed && (
        <div className="px-3 py-2 mx-3 mb-3 bg-warning/10 border border-warning/25 rounded-lg">
          <p className="text-xs text-warning font-medium">Modo demonstração</p>
          <Link href="/auth/login" className="text-xs text-warning/80 hover:text-warning underline">
            Fazer login real
          </Link>
        </div>
      )}

      {/* Collapse button */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
