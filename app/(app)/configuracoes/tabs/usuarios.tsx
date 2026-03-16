'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Users, UserPlus, Shield, Trash2, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User, UserRole } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  analyst: 'Analista',
  viewer: 'Visualizador',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-primary/10 text-primary border-primary/30',
  analyst: 'bg-info/10 text-info border-info/30',
  viewer: 'bg-muted/10 text-muted-foreground border-border',
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  )
}

export default function UsuariosTab() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('analyst')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  const { data } = useSWR<{ users: User[] }>('/api/configuracoes/usuarios', fetcher)
  const users = data?.users ?? []

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) { setInviteError('E-mail é obrigatório'); return }
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')
    const res = await fetch('/api/configuracoes/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const json = await res.json()
    if (!res.ok) {
      setInviteError(json.error ?? 'Erro ao convidar usuário')
    } else {
      setInviteSuccess(`Convite enviado para ${inviteEmail}`)
      setInviteEmail('')
      mutate('/api/configuracoes/usuarios')
    }
    setInviting(false)
  }

  async function changeRole(userId: string, role: UserRole) {
    await fetch('/api/configuracoes/usuarios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, role }),
    })
    mutate('/api/configuracoes/usuarios')
  }

  async function removeUser(userId: string) {
    if (!confirm('Remover este usuário da organização?')) return
    await fetch('/api/configuracoes/usuarios', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId }),
    })
    mutate('/api/configuracoes/usuarios')
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Convidar */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Convidar Usuário</span>
        </div>
        <form onSubmit={handleInvite} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@empresa.com"
                className="w-full bg-surface-2 border border-border rounded text-foreground text-sm pl-9 pr-3 py-2 outline-none focus:border-primary transition-colors"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="bg-surface-2 border border-border rounded text-foreground text-sm px-3 py-2 outline-none focus:border-primary transition-colors"
            >
              <option value="admin">Administrador</option>
              <option value="analyst">Analista</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>
          {inviteError && <p className="text-xs text-danger">{inviteError}</p>}
          {inviteSuccess && <p className="text-xs text-success">{inviteSuccess}</p>}
          <button
            type="submit"
            disabled={inviting}
            className="self-start flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {inviting ? 'Enviando...' : 'Enviar convite'}
          </button>
        </form>
      </div>

      {/* Lista de usuários */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Membros da Organização</span>
          <span className="ml-auto text-xs text-muted-foreground">{users.length} membro(s)</span>
        </div>
        {users.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary uppercase">
                    {user.full_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
                    className="bg-surface-2 border border-border rounded text-foreground text-xs px-2 py-1 outline-none focus:border-primary transition-colors"
                  >
                    <option value="admin">Admin</option>
                    <option value="analyst">Analista</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-1.5 rounded border border-border text-muted-foreground hover:text-danger hover:border-danger/40 transition-colors"
                    title="Remover usuário"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Papéis e permissões */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Permissões por Papel</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {(['admin', 'analyst', 'viewer'] as UserRole[]).map((role) => (
            <div key={role} className="bg-surface-2 rounded-lg p-3 border border-border">
              <RoleBadge role={role} />
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {role === 'admin' && (
                  <>
                    <li>Gerenciar clientes</li>
                    <li>Configurar integrações</li>
                    <li>Gerenciar usuários</li>
                    <li>Todos os relatórios</li>
                  </>
                )}
                {role === 'analyst' && (
                  <>
                    <li>Ver todos os dados</li>
                    <li>Exportar relatórios</li>
                    <li>Sincronizar dados</li>
                  </>
                )}
                {role === 'viewer' && (
                  <>
                    <li>Apenas leitura</li>
                    <li>Ver relatórios</li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
