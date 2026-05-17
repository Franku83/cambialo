// apps/web/src/app/(auth)/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Mail, Lock, Chrome, Loader2 } from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'magic-link'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'password') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password!,
        });

        if (authError) throw authError;
        router.push('/dashboard');
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (otpError) throw otpError;
        setMessage('Revisa tu email para el enlace de acceso');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Bienvenido de nuevo</h2>
        <p className="text-zinc-400 text-sm">
          Ingresa a tu cuenta para comprar y vender tecnología.
        </p>
      </div>

      <div className="flex bg-zinc-800 p-1 rounded-lg">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'password' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Contraseña
        </button>
        <button
          onClick={() => setMode('magic-link')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'magic-link' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        {mode === 'password' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-zinc-300">Contraseña</label>
              <Link href="/forgot-password" className="text-xs text-blue-500 hover:text-blue-400">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
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
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-emerald-500 text-sm text-center">{message}</p>
          </div>
        )}

        <div className="cf-turnstile" data-sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
          {mode === 'password' ? 'Iniciar Sesión' : 'Enviar Enlace'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-900 px-2 text-zinc-500">O continúa con</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        className="w-full bg-white text-zinc-950 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
      >
        <Chrome className="w-5 h-5" />
        Google
      </button>

      <p className="text-center text-sm text-zinc-400">
        ¿No tienes una cuenta?{' '}
        <Link href="/register" className="text-blue-500 hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
