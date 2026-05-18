'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Mail, Lock, User, AtSign, Loader2 } from 'lucide-react'
import Link from 'next/link'

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

type RegisterForm = z.infer<typeof registerSchema>

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-green-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(22,163,74,0.15)]'
const labelCls = 'text-sm font-medium text-slate-700'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    setError(null)
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { username: data.username, full_name: data.fullName },
        },
      })
      if (signUpError) throw signUpError
      setSuccess(true)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message ?? 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">¡Casi listo!</h2>
        <p className="text-slate-500 text-sm">
          Enviamos un enlace de confirmación a tu correo. Revisa tu bandeja de entrada.
        </p>
        <Link href="/login" className="inline-block font-medium text-green-600 hover:text-green-700">
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-slate-500">Únete al marketplace de smartphones verificados.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelCls}>Nombre completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register('fullName')} type="text" className={inputCls} placeholder="Juan Pérez" />
            </div>
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Usuario</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input {...register('username')} type="text" className={inputCls} placeholder="juan_perez" />
            </div>
            {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input {...register('email')} type="email" className={inputCls} placeholder="tu@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input {...register('password')} type="password" className={inputCls} placeholder="Mínimo 8 caracteres" />
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          Registrarse
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
