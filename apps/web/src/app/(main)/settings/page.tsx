'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Shield,
  Bell,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { apiCall } from '@/lib/api-client'
import { createClient } from '@/lib/supabase/client'

// Components
function ChangeEmailForm({ currentEmail, token }: { currentEmail: string; token: string }) {
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await apiCall('/api/v1/auth/settings/change-email', {
        method: 'POST',
        body: JSON.stringify({ newEmail }),
        token,
      })
      setSuccess(true)
      setNewEmail('')
    } catch (err: any) {
      setError(err.message || 'Error al cambiar email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-700">Cambiar email</label>
        <p className="text-xs text-slate-400 mt-0.5">Email actual: {currentEmail}</p>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="nuevo@email.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !newEmail}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Actualizar'}
        </button>
      </div>
      {success && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Email actualizado.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function ChangePasswordForm({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await apiCall('/api/v1/auth/settings/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
        token,
      })
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <label className="text-sm font-medium text-slate-700">Cambiar contraseña</label>
      <div className="space-y-3">
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            placeholder="Contraseña actual"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-green-500 focus:outline-none"
          />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-green-500 focus:outline-none"
          />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
        {success && <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Contraseña actualizada con éxito.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

function TwoFactorSection({ token, userId }: { token: string; userId: string }) {
  const [status, setStatus] = useState<{ enabled: boolean; factors: any[] } | null>(null)
  const [isCriticalRole, setIsCriticalRole] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      const res = await apiCall<{ enabled: boolean; factors: any[] }>('/api/v1/auth/settings/2fa-status', { token })
      setStatus(res)
    } catch (e) {
      console.error(e)
    }
  }

  const checkRole = async () => {
    try {
      const supabase = createClient()
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      const isCritical = (roles as { role: string }[] | null)?.some(r =>
        ['moderator', 'admin', 'owner'].includes(r.role)
      )
      setIsCriticalRole(!!isCritical)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    Promise.all([fetchStatus(), checkRole()]).finally(() => setLoading(false))
  }, [userId])

  const handleDisable2FA = async (factorId: string) => {
    try {
      await apiCall(`/api/v1/auth/settings/2fa/${factorId}`, {
        method: 'DELETE',
        token,
      })
      await fetchStatus()
    } catch (e) {
      alert('Error al desactivar 2FA')
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Cargando estado 2FA...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Autenticación en dos pasos (2FA)</p>
          <p className="text-xs text-slate-500 mt-1">Protege tu cuenta con un código adicional.</p>
        </div>
        <div className="flex items-center gap-2">
          {status?.enabled ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <CheckCircle2 className="w-4 h-4" /> Activado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
              <AlertTriangle className="w-4 h-4" /> Inactivo
            </span>
          )}
        </div>
      </div>
      
      {status?.enabled ? (
        <div className="pt-4 border-t border-slate-100">
          {isCriticalRole ? (
            <p className="text-sm text-slate-600 flex items-center gap-2 bg-slate-50 p-3 rounded-lg">
              <Lock className="w-4 h-4 text-slate-500" />
              Los administradores no pueden desactivar el 2FA.
            </p>
          ) : (
            <div className="space-y-2">
              {status.factors.map(f => (
                <div key={f.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="text-sm text-slate-700 font-mono text-xs">{f.id}</span>
                  <button
                    onClick={() => handleDisable2FA(f.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Desactivar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => window.location.href = '/setup-2fa'}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Activar 2FA
          </button>
        </div>
      )}
    </div>
  )
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-slate-700 font-medium">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-green-500' : 'bg-slate-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function NotificationsSection({ token }: { token: string }) {
  const [prefs, setPrefs] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiCall('/api/v1/auth/settings/notifications', { token })
      .then(res => setPrefs(res))
      .catch(e => console.error(e))
      .finally(() => setLoading(false))
  }, [token])

  const updatePref = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs)
    
    // Optimistic UI, but debounce/save in background
    setSaving(true)
    try {
      await apiCall('/api/v1/auth/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(newPrefs),
        token
      })
    } catch (e) {
      console.error('Error saving notifications', e)
      // Revert if failed (simplified here)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Cargando notificaciones...</div>
  if (!prefs) return <div className="text-sm text-slate-500">Error al cargar configuraciones</div>

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master</h3>
        <Toggle checked={!!prefs.pushEnabled} onChange={v => updatePref('pushEnabled', v)} label="Notificaciones push" />
        <Toggle checked={!!prefs.emailEnabled} onChange={v => updatePref('emailEnabled', v)} label="Notificaciones por email" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actividad</h3>
        <Toggle checked={!!prefs.listingVerified} onChange={v => updatePref('listingVerified', v)} label="Cuando verifican mi listing" />
        <Toggle checked={!!prefs.listingRejected} onChange={v => updatePref('listingRejected', v)} label="Cuando rechazan mi listing" />
        <Toggle checked={!!prefs.newOffer} onChange={v => updatePref('newOffer', v)} label="Cuando recibo una oferta" />
        <Toggle checked={!!prefs.reviewRequest} onChange={v => updatePref('reviewRequest', v)} label="Cuando me dejan una reseña" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas</h3>
        <Toggle checked={!!prefs.searchAlert} onChange={v => updatePref('searchAlert', v)} label="Alertas de búsqueda" />
        <Toggle checked={!!prefs.priceAlert} onChange={v => updatePref('priceAlert', v)} label="Bajas de precio en guardados" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cambialo</h3>
        <Toggle checked={!!prefs.marketingEmails} onChange={v => updatePref('marketingEmails', v)} label="Novedades de Cambialo" />
      </div>
      
      {saving && <p className="text-xs text-slate-400 flex justify-end">Guardando...</p>}
    </div>
  )
}

function DangerZoneSection() {
  const [expanded, setExpanded] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDelete = () => {
    alert("Contacta soporte para eliminar tu cuenta")
    setExpanded(false)
    setConfirmText('')
  }

  return (
    <div className="space-y-4">
      {!expanded ? (
        <div>
          <p className="text-sm text-slate-600 mb-3">Una vez eliminada tu cuenta, no hay vuelta atrás. Por favor, asegúrate.</p>
          <button
            onClick={() => setExpanded(true)}
            className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            Eliminar mi cuenta
          </button>
        </div>
      ) : (
        <div className="bg-red-50 p-4 rounded-xl border border-red-100 space-y-3">
          <p className="text-sm text-red-800 font-medium">Esta acción es irreversible.</p>
          <p className="text-xs text-red-700">Para confirmar, escribe <strong>ELIMINAR</strong> a continuación:</p>
          <input
            type="text"
            placeholder="ELIMINAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setExpanded(false); setConfirmText(''); }}
              className="flex-1 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== 'ELIMINAR'}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user, session } = useAuthStore()

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-slate-500 text-center">Inicia sesión para ver tus ajustes.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Ajustes</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-5 h-5 text-slate-500" /> Cuenta
        </h2>
        <ChangeEmailForm currentEmail={user?.email || ''} token={session.access_token} />
        <ChangePasswordForm token={session.access_token} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" /> Seguridad
        </h2>
        <TwoFactorSection token={session.access_token} userId={user?.id || ''} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-500" /> Notificaciones
        </h2>
        <NotificationsSection token={session.access_token} />
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Zona de peligro
        </h2>
        <DangerZoneSection />
      </section>
    </div>
  )
}
