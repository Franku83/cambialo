'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Shield, User, Crown, Loader2, Plus, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type UserRole = 'user' | 'moderator' | 'admin' | 'owner'

interface UserRecord {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl: string | null
  idVerified: boolean
  isBanned: boolean
  createdAt: string
  roles: { role: UserRole }[]
}

const ROLE_META: Record<UserRole, { label: string; color: string; icon: React.ReactNode }> = {
  user:      { label: 'Usuario',    color: 'bg-slate-100 text-slate-600',  icon: <User className="h-3 w-3" /> },
  moderator: { label: 'Moderador', color: 'bg-blue-100 text-blue-700',    icon: <Shield className="h-3 w-3" /> },
  admin:     { label: 'Admin',     color: 'bg-purple-100 text-purple-700', icon: <Shield className="h-3 w-3" /> },
  owner:     { label: 'Owner',     color: 'bg-amber-100 text-amber-700',  icon: <Crown className="h-3 w-3" /> },
}

const ALL_ROLES: UserRole[] = ['user', 'moderator', 'admin', 'owner']

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pendingRole, setPendingRole] = useState<{ userId: string; action: 'add' | 'remove'; role: UserRole } | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login?redirectTo=/admin/users'); return null }
    return session.access_token
  }, [router])

  const fetchUsers = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) { setUnauthorized(true); return }
      const data = await res.json() as { users: UserRecord[]; total: number }
      setUsers(data.users)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const token = await getToken()
      if (!token) return
      setAuthToken(token)
      await fetchUsers(token)
    })()
  }, [getToken, fetchUsers])

  const handleRoleToggle = async (userId: string, role: UserRole, hasRole: boolean) => {
    if (!authToken) return
    setPendingRole({ userId, action: hasRole ? 'remove' : 'add', role })
    try {
      if (hasRole) {
        await fetch(`${API_URL}/api/v1/admin/users/${userId}/roles/${role}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        })
      } else {
        await fetch(`${API_URL}/api/v1/admin/users/${userId}/roles`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        })
      }
      await fetchUsers(authToken)
    } finally {
      setPendingRole(null)
    }
  }

  const filtered = users.filter(u =>
    !search ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName.toLowerCase().includes(search.toLowerCase())
  )

  if (unauthorized) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold text-slate-900">Acceso restringido</h1>
        <p className="text-slate-500">Solo owners y admins pueden ver esta sección.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión de usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">{total} usuarios registrados</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por username, email o nombre..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Roles</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => {
                const userRoles = u.roles.map(r => r.role)
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs font-bold">
                            {u.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">@{u.username}</p>
                          <p className="text-xs text-slate-400">{u.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_ROLES.filter(r => r !== 'user').map(role => {
                          const hasRole = userRoles.includes(role)
                          const meta = ROLE_META[role]
                          const isPending = pendingRole?.userId === u.id && pendingRole.role === role
                          return (
                            <button
                              key={role}
                              onClick={() => void handleRoleToggle(u.id, role, hasRole)}
                              disabled={!!pendingRole}
                              className={cn(
                                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                                hasRole
                                  ? meta.color
                                  : 'border border-dashed border-slate-300 text-slate-400 hover:border-slate-400',
                                isPending && 'opacity-50',
                              )}
                              title={hasRole ? `Quitar rol ${role}` : `Dar rol ${role}`}
                            >
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : hasRole ? (
                                <>{meta.icon}<X className="h-3 w-3 ml-0.5" /></>
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                              {meta.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
