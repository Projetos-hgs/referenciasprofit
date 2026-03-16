'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Financeiro',
    icon: TrendingUp,
    children: [
      { label: 'Contas a Receber', href: '/financeiro/receber', icon: ArrowDownCircle },
      { label: 'Contas a Pagar', href: '/financeiro/pagar', icon: ArrowUpCircle },
      { label: 'Fluxo de Caixa', href: '/financeiro/fluxo', icon: TrendingUp },
    ],
  },
  {
    label: 'Relatórios',
    icon: BarChart3,
    children: [
      { label: 'DRE', href: '/relatorios/dre', icon: BarChart3 },
    ],
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: Users,
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(['Financeiro', 'Relatórios'])

  function toggleGroup(label: string) {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    )
  }

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
          <span className="font-bold text-primary-foreground text-sm">P</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-foreground text-sm truncate">BPO Financeiro</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          if ('children' in item) {
            const isOpen = openGroups.includes(item.label)
            const isActive = item.children.some((c) => pathname.startsWith(c.href))

            return (
              <div key={item.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(item.label)}
                  className={cn(
                    'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors rounded-none',
                    isActive
                      ? 'text-foreground bg-surface-2'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronRight
                        className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-90')}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="pl-3">
                    {item.children.map((child) => {
                      const active = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors rounded-none border-l border-border ml-2',
                            active
                              ? 'text-primary border-primary bg-primary/5'
                              : 'text-muted-foreground hover:text-foreground hover:border-muted'
                          )}
                        >
                          <child.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-2'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

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
