'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string | undefined
  username?: string
  fullName?: string
  avatarUrl?: string | null
  isVerifiedSeller?: boolean
  idVerified?: boolean
  reputationScore?: number
}

interface AuthState {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: AuthUser | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  updateUserFromSupabase: (supabaseUser: User) => void
  updateProfile: (data: Partial<AuthUser>) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setInitialized: (isInitialized) => set({ isInitialized }),

      updateUserFromSupabase: (supabaseUser) =>
        set((state) => {
          const merged: AuthUser = { id: supabaseUser.id, email: supabaseUser.email }
          const meta = supabaseUser.user_metadata ?? {}
          if (meta['username'] ?? state.user?.username) merged.username = meta['username'] ?? state.user?.username
          if (meta['full_name'] ?? state.user?.fullName) merged.fullName = meta['full_name'] ?? state.user?.fullName
          if (meta['avatar_url'] ?? state.user?.avatarUrl) merged.avatarUrl = meta['avatar_url'] ?? state.user?.avatarUrl
          if (state.user?.isVerifiedSeller !== undefined) merged.isVerifiedSeller = state.user.isVerifiedSeller
          if (state.user?.idVerified !== undefined) merged.idVerified = state.user.idVerified
          if (state.user?.reputationScore !== undefined) merged.reputationScore = state.user.reputationScore
          return { user: merged }
        }),

      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      signOut: () => set({ user: null, session: null }),
    }),
    {
      name: 'techmarket-auth',
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
)

/** Hook de conveniencia — solo devuelve si el usuario está autenticado */
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user)

/** Hook para el usuario actual */
export const useCurrentUser = () => useAuthStore((state) => state.user)
