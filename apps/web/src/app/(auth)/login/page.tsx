'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Mail, Lock, Chrome, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
})

type LoginForm = z.infer<typeof loginSchema>

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]'
const labelCls = 'text-sm font-medium text-slate-700'

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      if (mode === 'password') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password!,
        })
        if (authError) throw authError
        router.push('/dashboard')
        router.refresh()
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (otpError) throw otpError
        setMessage('Revisa tu email para el enlace de acceso')
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-slate-500">Ingresa a tu cuenta para comprar y vender.</p>
      </div>

      {/* Mode tabs */}
      <div className="flex rounded-lg border border-slate-200 p-1">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'password'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Contraseña
        </button>
        <button
          onClick={() => setMode('magic-link')}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            mode === 'magic-link'
              ? 'bg-green-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelCls}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input {...register('email')} type="email" className={inputCls} placeholder="tu@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {mode === 'password' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-green-600 hover:text-green-700">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`${inputCls} pr-10`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}
        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-center text-sm text-green-700">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          {mode === 'password' ? 'Iniciar Sesión' : 'Enviar Enlace'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400">O continúa con</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <Chrome className="h-5 w-5" />
        Google
      </button>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes una cuenta?{' '}
        <Link href="/register" className="font-medium text-green-600 hover:text-green-700">
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}
