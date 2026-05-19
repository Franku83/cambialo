'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Camera, Instagram, Twitter, Globe, Phone, MapPin, AtSign } from 'lucide-react'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-500 focus:bg-white transition-colors'
const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5'

type ProfileFields = {
  full_name: string
  username: string
  bio: string
  location_city: string
  location_state: string
  whatsapp_number: string
  whatsapp_public: boolean
  instagram: string
  twitter: string
  tiktok: string
  website: string
  avatar_url: string
}

const VENEZUELA_STATES = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Dependencias Federales','Distrito Capital',
  'Falcón','Guárico','Lara','Mérida','Miranda','Monagas','Nueva Esparta',
  'Portuguesa','Sucre','Táchira','Trujillo','Vargas','Yaracuy','Zulia',
]

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<ProfileFields>({
    full_name: '', username: '', bio: '', location_city: '', location_state: '',
    whatsapp_number: '', whatsapp_public: false,
    instagram: '', twitter: '', tiktok: '', website: '', avatar_url: '',
  })

  useEffect(() => {
    const supabase = createClient()
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, username, bio, location_city, location_state, whatsapp_number, whatsapp_public, instagram, twitter, tiktok, website, avatar_url')
        .eq('id', data.user.id)
        .single()
      if (profile) {
        const p = profile as Partial<ProfileFields>
        setForm({
          full_name: p.full_name ?? '',
          username: p.username ?? '',
          bio: p.bio ?? '',
          location_city: p.location_city ?? '',
          location_state: p.location_state ?? '',
          whatsapp_number: p.whatsapp_number ?? '',
          whatsapp_public: p.whatsapp_public ?? false,
          instagram: p.instagram ?? '',
          twitter: p.twitter ?? '',
          tiktok: p.tiktok ?? '',
          website: p.website ?? '',
          avatar_url: p.avatar_url ?? '',
        })
      }
      setLoading(false)
    })
  }, [router])

  const set = (key: keyof ProfileFields, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase as any)
      .from('users')
      .update({
        full_name: form.full_name.trim(),
        bio: form.bio.trim() || null,
        location_city: form.location_city.trim() || null,
        location_state: form.location_state || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        whatsapp_public: form.whatsapp_public,
        instagram: form.instagram.replace('@', '').trim() || null,
        twitter: form.twitter.replace('@', '').trim() || null,
        tiktok: form.tiktok.replace('@', '').trim() || null,
        website: form.website.trim() || null,
      })
      .eq('id', user.id)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(() => router.push(`/profile/${form.username}`), 1200)
  }

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
    </div>
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Editar perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Tu información pública en Cambialo</p>
      </div>

      <div className="space-y-6">

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="avatar" className="h-20 w-20 rounded-full object-cover border-2 border-slate-200" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700 border-2 border-slate-200">
                {form.full_name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Foto de perfil</p>
            <p className="mt-0.5 text-xs text-slate-400">Cambia tu foto desde la configuración de Supabase Auth</p>
          </div>
        </div>

        {/* Básico */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Información básica</h2>

          <div>
            <label className={labelCls}>Nombre completo</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className={inputCls} placeholder="Tu nombre real" />
          </div>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><AtSign className="h-3.5 w-3.5" /> Usuario</span>
            </label>
            <input value={form.username} disabled
              className={`${inputCls} opacity-50 cursor-not-allowed`} />
            <p className="mt-1 text-xs text-slate-400">El username no se puede cambiar por ahora</p>
          </div>

          <div>
            <label className={labelCls}>Bio</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
              rows={3} maxLength={280}
              placeholder="Cuéntale a la gente quién eres y qué vendes..."
              className={`${inputCls} resize-none`} />
            <p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/280</p>
          </div>
        </div>

        {/* Ubicación */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ubicación</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ciudad</span>
              </label>
              <input value={form.location_city} onChange={e => set('location_city', e.target.value)}
                className={inputCls} placeholder="Caracas" />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={form.location_state} onChange={e => set('location_state', e.target.value)}
                className={inputCls}>
                <option value="">Seleccionar...</option>
                {VENEZUELA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contacto</h2>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</span>
            </label>
            <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)}
              className={inputCls} placeholder="+58 412 0000000" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Mostrar WhatsApp públicamente</p>
              <p className="text-xs text-slate-400">Visible en tu perfil para todos</p>
            </div>
            <button type="button"
              onClick={() => set('whatsapp_public', !form.whatsapp_public)}
              className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${form.whatsapp_public ? 'bg-green-600' : 'bg-slate-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${form.whatsapp_public ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Redes sociales */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Redes sociales</h2>

          {[
            { key: 'instagram' as const, icon: <Instagram className="h-4 w-4 text-pink-500" />, placeholder: 'tu_usuario', prefix: 'instagram.com/' },
            { key: 'twitter' as const, icon: <Twitter className="h-4 w-4 text-sky-500" />, placeholder: 'tu_usuario', prefix: 'x.com/' },
            { key: 'tiktok' as const, icon: <span className="text-sm font-bold text-slate-700">TT</span>, placeholder: 'tu_usuario', prefix: 'tiktok.com/@' },
            { key: 'website' as const, icon: <Globe className="h-4 w-4 text-slate-500" />, placeholder: 'https://tu-sitio.com', prefix: '' },
          ].map(({ key, icon, placeholder, prefix }) => (
            <div key={key}>
              <label className={labelCls}>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-green-500 focus-within:bg-white transition-colors">
                <span className="shrink-0">{icon}</span>
                {prefix && <span className="text-xs text-slate-400 shrink-0">{prefix}</span>}
                <input
                  value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Errores y éxito */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✓ Perfil actualizado. Redirigiendo...
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button onClick={() => router.back()}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={() => void handleSave()} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
