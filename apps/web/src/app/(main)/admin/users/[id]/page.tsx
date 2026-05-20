'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Shield, Crown, User, Loader2, Trash2,
  CheckCircle2, XCircle, AlertTriangle, Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

type UserRole = 'user' | 'moderator' | 'admin' | 'owner'
type KycStatus = 'none' | 'pending' | 'approved' | 'rejected'

interface Listing {
  id: string
  priceUsd: string
  status: string
  verificationStatus: string
  deviceModel: { brand: string; modelName: string }
}

interface UserDetail {
  id: string
  email: string
  username: string
  fullName: string
  avatarUrl: string | null
  idVerified: boolean
  kycStatus: KycStatus
  isBanned: boolean
  banReason: string | null
  isSuspended: boolean
  suspendedUntil: string | null
  suspendReason: string | null
  reputationScore: number
  totalSales: number
  totalPurchases: number
  createdAt: string
  roles: { role: UserRole }[]
  listings: Listing[]
  _count: { listings: number; reviewsReceived: number }
}

const KYC_META: Record<KycStatus, { label: string; cls: string }> = {
  none:     { label: 'Sin KYC',    cls: 'bg-slate-100 text-slate-500' },
  pending:  { label: 'KYC Pendiente', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'KYC Aprobado',  cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'KYC Rechazado', cls: 'bg-red-100 text-red-700' },
}

const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  user:      { label: 'Usuario',    color: 'bg-slate-100 text-slate-600' },
  moderator: { label: 'Moderador',  color: 'bg-blue-100 text-blue-700' },
  admin:     { label: 'Admin',      color: 'bg-purple-100 text-purple-700' },
  owner:     { label: 'Owner',      color: 'bg-amber-100 text-amber-700' },
}

function StatusBadge({ user }: { user: UserDetail }) {
  if (user.isBanned) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
      <Ban className="h-3.5 w-3.5" /> Baneado
    </span>
  )
  if (user.isSuspended) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
      <AlertTriangle className="h-3.5 w-3.5" /> Suspendido
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Activo
    </span>
  )
}

export default function AdminUserDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  // Modal state
  const [suspendModal, setSuspendModal] = useState(false)
  const [banModal, setBanModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendDays, setSuspendDays] = useState('7')
  const [banReason, setBanReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Username edit
  const [usernameEdit, setUsernameEdit] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return null }
    return session.access_token
  }, [router])

  const fetchUser = useCallback(async (tok: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.status === 401 || res.status === 403) { setUnauthorized(true); return }
      setUser(await res.json() as UserDetail)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void (async () => {
      const tok = await getToken()
      if (!tok) return
      setToken(tok)
      await fetchUser(tok)
    })()
  }, [getToken, fetchUser])

  const call = async (path: string, method: string, body?: object) => {
    if (!token) return
    setActionLoading(path)
    try {
      const init: RequestInit = { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      if (body) init.body = JSON.stringify(body)
      await fetch(`${API_URL}/api/v1/admin/${path}`, init)
      await fetchUser(token)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSuspend = async () => {
    await call(`users/${id}/suspend`, 'POST', { reason: suspendReason, days: Number(suspendDays) })
    setSuspendModal(false)
    setSuspendReason('')
  }

  const handleBan = async () => {
    await call(`users/${id}/ban`, 'POST', { reason: banReason })
    setBanModal(false)
    setBanReason('')
  }

  const handleUsernameChange = async () => {
    if (!token) return
    const clean = newUsername.trim().toLowerCase()
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(clean)) {
      setUsernameError('3-20 caracteres, solo letras, números y _')
      return
    }
    setUsernameError(null)
    setActionLoading('username')
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/users/${id}/username`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        setUsernameError(body.message ?? 'Error al cambiar el username')
        return
      }
      setUsernameEdit(false)
      setNewUsername('')
      await fetchUser(token)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('¿Eliminar este listing?')) return
    await call(`users/${id}/listings/${listingId}`, 'DELETE')
  }

  if (unauthorized) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <Shield className="h-12 w-12 text-red-400" />
      <h1 className="text-xl font-bold text-slate-900">Acceso restringido</h1>
    </div>
  )

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  if (!user) return (
    <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
      Usuario no encontrado
    </div>
  )

  const userRoles = user.roles.map(r => r.role)

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a usuarios
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-500">
            {user.username[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">@{user.username}</h1>
            <StatusBadge user={user} />
            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KYC_META[user.kycStatus].cls)}>
              {KYC_META[user.kycStatus].label}
            </span>
          </div>
          <p className="text-sm text-slate-600">{user.fullName}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
          <p className="text-xs text-slate-400">
            Registrado: {new Date(user.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {user.isSuspended && user.suspendedUntil && (
            <p className="text-xs text-orange-600">
              Suspendido hasta {new Date(user.suspendedUntil).toLocaleDateString('es-VE')} — {user.suspendReason}
            </p>
          )}
          {user.isBanned && user.banReason && (
            <p className="text-xs text-red-600">Razón: {user.banReason}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ventas', value: user.totalSales },
          { label: 'Compras', value: user.totalPurchases },
          { label: 'Reseñas', value: user._count.reviewsReceived },
          { label: 'Listings', value: user._count.listings },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Roles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Roles</h2>
        <div className="flex flex-wrap gap-2">
          {userRoles.length > 0 ? userRoles.map(r => (
            <span key={r} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', ROLE_META[r].color)}>
              {r === 'owner' ? <Crown className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {ROLE_META[r].label}
            </span>
          )) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              <User className="h-3 w-3" /> Usuario
            </span>
          )}
        </div>
        {/* Solo mostrar controles de asignación para roles no-owner */}
        {!userRoles.includes('owner') && (
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {(['moderator', 'admin'] as const).map(role => {
              const hasRole = userRoles.includes(role)
              const meta = ROLE_META[role]
              return (
                <button
                  key={role}
                  onClick={() => void call(`users/${id}/roles${hasRole ? `/${role}` : ''}`, hasRole ? 'DELETE' : 'POST', hasRole ? undefined : { role })}
                  disabled={!!actionLoading}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border',
                    hasRole
                      ? `${meta.color} border-transparent`
                      : 'border-dashed border-slate-300 text-slate-400 hover:border-slate-400',
                    actionLoading && 'opacity-50',
                  )}
                >
                  {actionLoading === `users/${id}/roles/${role}` || actionLoading === `users/${id}/roles`
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Shield className="h-3 w-3" />
                  }
                  {hasRole ? `Quitar ${meta.label}` : `Dar ${meta.label}`}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Acciones</h2>
        <div className="flex flex-wrap gap-2">
          {!user.isBanned && !user.isSuspended && (
            <button
              onClick={() => setSuspendModal(true)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
            >
              Suspender
            </button>
          )}
          {user.isSuspended && (
            <button
              onClick={() => void call(`users/${id}/unsuspend`, 'POST')}
              disabled={!!actionLoading}
              className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {actionLoading === `users/${id}/unsuspend` ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Levantar suspensión'}
            </button>
          )}
          {!user.isBanned && (
            <button
              onClick={() => setBanModal(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              Banear
            </button>
          )}
          {user.isBanned && (
            <button
              onClick={() => void call(`users/${id}/unban`, 'POST')}
              disabled={!!actionLoading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {actionLoading === `users/${id}/unban` ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Desbanear'}
            </button>
          )}
          {!user.idVerified && (
            <button
              onClick={() => void call(`users/${id}/verify`, 'POST')}
              disabled={!!actionLoading}
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {actionLoading === `users/${id}/verify`
                ? <Loader2 className="h-4 w-4 animate-spin inline" />
                : '✓ Verificar manualmente'
              }
            </button>
          )}
          {user.idVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Verificado
            </span>
          )}
        </div>

        {/* Cambiar username */}
        <div className="border-t border-slate-100 pt-3">
          {!usernameEdit ? (
            <button
              onClick={() => { setNewUsername(user.username); setUsernameEdit(true); setUsernameError(null) }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              ✏️ Cambiar username (@{user.username})
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">Nuevo username</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">@</span>
                  <input
                    value={newUsername}
                    onChange={e => { setNewUsername(e.target.value); setUsernameError(null) }}
                    placeholder={user.username}
                    maxLength={20}
                    className="w-full rounded-lg border border-slate-200 py-2 pl-7 pr-3 text-sm outline-none focus:border-green-500"
                    onKeyDown={e => { if (e.key === 'Enter') void handleUsernameChange(); if (e.key === 'Escape') setUsernameEdit(false) }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => void handleUsernameChange()}
                  disabled={actionLoading === 'username' || !newUsername.trim()}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'username' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                </button>
                <button
                  onClick={() => { setUsernameEdit(false); setUsernameError(null) }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              {usernameError && <p className="text-xs text-red-500">{usernameError}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Listings activos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Listings activos ({user.listings.length})
        </h2>
        {user.listings.length === 0 ? (
          <p className="text-sm text-slate-400">Sin listings activos</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {user.listings.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {l.deviceModel.brand} {l.deviceModel.modelName}
                  </p>
                  <p className="text-xs text-slate-400">
                    ${l.priceUsd} · {l.verificationStatus === 'verified' ? '✓ Verificado' : 'Sin verificar'}
                  </p>
                </div>
                <button
                  onClick={() => void handleDeleteListing(l.id)}
                  disabled={actionLoading === `users/${id}/listings/${l.id}`}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Eliminar listing"
                >
                  {actionLoading === `users/${id}/listings/${l.id}`
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal — Suspender */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Suspender usuario</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Razón</label>
                <input
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                  placeholder="Motivo de la suspensión..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Días</label>
                <select
                  value={suspendDays}
                  onChange={e => setSuspendDays(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                >
                  {['1', '3', '7', '14', '30'].map(d => (
                    <option key={d} value={d}>{d} día{d !== '1' ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSuspendModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSuspend()}
                disabled={!suspendReason.trim() || !!actionLoading}
                className="flex-1 rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Banear */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-bold text-slate-900">Banear usuario</h3>
            </div>
            <p className="text-sm text-slate-500">
              Esta acción es permanente. El email quedará bloqueado y todos sus listings se desactivarán.
            </p>
            <div>
              <label className="text-sm font-medium text-slate-700">Razón</label>
              <input
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500"
                placeholder="Motivo del baneo..."
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setBanModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleBan()}
                disabled={!banReason.trim() || !!actionLoading}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin inline" /> : 'Banear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
