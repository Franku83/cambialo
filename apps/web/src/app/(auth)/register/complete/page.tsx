'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AtSign, Loader2, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [userInfo, setUserInfo] = useState<{ fullName: string; email: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const meta = data.user.user_metadata as { full_name?: string; name?: string }
      setUserInfo({
        fullName: meta.full_name ?? meta.name ?? '',
        email: data.user.email ?? '',
      })
    })
  }, [router])

  useEffect(() => {
    if (!username || username.length < 3) {
      setAvailable(null)
      return
    }
    const t = setTimeout(async () => {
      setChecking(true)
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/check-username?username=${encodeURIComponent(username)}`)
        const data = await res.json() as { available: boolean }
        setAvailable(data.available)
      } catch {
        setAvailable(null)
      } finally {
        setChecking(false)
      }
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || available === false) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('users')
      .update({ username: username.trim().toLowerCase(), full_name: userInfo?.fullName ?? '' })
      .eq('id', user.id)

    setLoading(false)
    if (err) { setError(err.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Elige tu usuario</h2>
        <p className="mt-1 text-sm text-slate-500">
          Solo falta un paso para completar tu cuenta de Cambialo.
        </p>
      </div>

      {userInfo && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
            {userInfo.fullName[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{userInfo.fullName}</p>
            <p className="text-xs text-slate-400">{userInfo.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nombre de usuario</label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setAvailable(null) }}
              type="text"
              maxLength={20}
              className={inputCls}
              placeholder="tu_usuario"
            />
            {checking && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
            )}
            {!checking && available === true && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          <p className="text-xs text-slate-400">3-20 caracteres, solo letras, números y guión bajo</p>
          {username.length > 0 && !isValid && (
            <p className="text-xs text-red-500">Solo letras, números y _ (3-20 caracteres)</p>
          )}
          {available === false && (
            <p className="text-xs text-red-500">Este usuario ya está en uso</p>
          )}
          {available === true && (
            <p className="text-xs text-green-600">¡Disponible!</p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isValid || available === false || available === null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? 'Guardando...' : 'Completar registro'}
        </button>
      </form>
    </div>
  )
}
