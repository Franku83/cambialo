// apps/web/src/app/(auth)/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, Mail, Lock, User, AtSign, Loader2 } from 'lucide-react';
import Link from 'next/link';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-white">¡Casi listo!</h2>
        <p className="text-zinc-400">
          Hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, revisa tu bandeja de entrada.
        </p>
        <Link 
          href="/login" 
          className="inline-block text-blue-500 hover:underline mt-4"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Crea tu cuenta</h2>
        <p className="text-zinc-400 text-sm">
          Únete a la comunidad de tecnología más grande de Venezuela.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Nombre Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                {...register('fullName')}
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="Juan Pérez"
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Usuario</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                {...register('username')}
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                placeholder="juan_perez"
              />
            </div>
            {errors.username && <p className="text-red-500 text-xs">{errors.username.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              {...register('email')}
              type="email"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="tu@email.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              {...register('password')}
              type="password"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
          Registrarse
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        ¿Ya tienes una cuenta?{' '}
        <Link href="/login" className="text-blue-500 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
