'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, Plus, X, User, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const BRANDS = [
  { label: 'Todos', value: '', href: '/' },
  { label: 'Apple', value: 'apple', href: '/apple' },
  { label: 'Samsung', value: 'samsung', href: '/samsung' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface QuickResult {
  id: string
  brand: string
  modelName: string
  priceUsd: string
  coverPhotoUrl?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function SearchBar({
  query,
  setQuery,
  results,
  showResults,
  setShowResults,
  onSubmit,
  searchRef,
}: {
  query: string
  setQuery: (v: string) => void
  results: QuickResult[]
  showResults: boolean
  setShowResults: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  searchRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={onSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Busca iPhone 14, Samsung S23..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-green-500 focus:bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/listings/${r.id}`}
              onClick={() => setShowResults(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50"
            >
              {r.coverPhotoUrl ? (
                <img src={r.coverPhotoUrl} alt="" className="h-10 w-10 rounded-md object-cover bg-slate-100" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-slate-100" />
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{r.brand} {r.modelName}</p>
              </div>
              <span className="text-sm font-semibold text-green-600">
                ${Number(r.priceUsd).toLocaleString('es-VE')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<QuickResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const activeBrand = searchParams.get('brand') ?? ''

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (userId: string) => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from('users').select('avatar_url, username').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ])
      const p = profile as { avatar_url?: string; username?: string } | null
      setAvatarUrl(p?.avatar_url ?? null)
      setUsername(p?.username ?? null)
      const r = (roles ?? []) as { role: string }[]
      setIsAdmin(r.some(x => x.role === 'admin' || x.role === 'owner'))
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) void loadProfile(data.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        void loadProfile(session.user.id)
      } else {
        setAvatarUrl(null)
        setUsername(null)
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }
    fetch(`${API_URL}/api/v1/listings?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((r) => r.json())
      .then((data: { data?: QuickResult[] }) => {
        setResults(data.data ?? [])
        setShowResults(true)
      })
      .catch(() => null)
  }, [debouncedQuery])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
        setShowResults(false)
        setMobileSearch(false)
      }
    },
    [query, router],
  )

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isHome = pathname === '/' || pathname.startsWith('/apple') || pathname.startsWith('/samsung')

  return (
    <>
      {/* Main header bar — sticky */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          {/* Logo */}
          <Link href="/" className="shrink-0 text-xl font-bold text-green-600 tracking-tight">
            Cambialo
          </Link>

          {/* Search — desktop */}
          <div className="hidden flex-1 min-w-0 justify-center px-4 md:flex max-w-[500px] mx-auto">
            <SearchBar
              query={query}
              setQuery={setQuery}
              results={results}
              showResults={showResults}
              setShowResults={setShowResults}
              onSubmit={handleSearch}
              searchRef={searchRef}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Search icon — mobile */}
            <button
              onClick={() => setMobileSearch(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors md:hidden"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Publicar */}
            <Link
              href="/sell"
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Publicar equipo</span>
            </Link>

            {/* Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 transition-colors hover:border-green-500"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-slate-500" />
                  )}
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                      {username && (
                        <Link href={`/profile/${username}`} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <User className="h-4 w-4" /> Mi perfil
                        </Link>
                      )}
                      {isAdmin && (
                        <>
                          <Link href="/admin/users" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                            <ShieldCheck className="h-4 w-4" /> Usuarios
                          </Link>
                          <Link href="/admin/moderation" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                            <ShieldCheck className="h-4 w-4" /> Moderación
                          </Link>
                          <Link href="/admin/kyc" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                            <ShieldCheck className="h-4 w-4" /> KYC
                          </Link>
                        </>
                      )}
                      <hr className="border-slate-100" />
                      <button onClick={handleSignOut} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" /> Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* Category nav — solo visible en home */}
        {isHome && (
          <div className="border-t border-slate-100">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex gap-0 overflow-x-auto scrollbar-hide">
                {BRANDS.map((b) => (
                  <Link
                    key={b.value}
                    href={b.href}
                    className={cn(
                      'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                      (b.value === '' ? pathname === '/' : pathname.startsWith(`/${b.value}`))
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {b.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile search overlay */}
      {mobileSearch && (
        <div className="fixed inset-0 z-50 bg-white p-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                query={query}
                setQuery={setQuery}
                results={results}
                showResults={showResults}
                setShowResults={setShowResults}
                onSubmit={handleSearch}
                searchRef={searchRef}
              />
            </div>
            <button
              onClick={() => { setMobileSearch(false); setQuery(''); setShowResults(false) }}
              className="shrink-0 text-slate-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
