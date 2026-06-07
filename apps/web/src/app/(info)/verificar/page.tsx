import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cómo verificar un smartphone antes de comprarlo',
  description:
    'Guía completa de verificación de smartphones usados en Venezuela. Evita estafas de iCloud, FRP, baterías falsas y reportes.',
}

interface GuideSectionProps {
  number: string
  title: string
  icon: string
  critical?: boolean
  children: React.ReactNode
}

function GuideSection({ number, title, icon, critical, children }: GuideSectionProps) {
  return (
    <div className={`rounded-2xl border p-6 transition-all hover:shadow-md ${
      critical 
        ? 'border-red-100 bg-red-50/10 hover:border-red-200' 
        : 'border-slate-200 bg-white hover:border-slate-300'
    } mb-8`}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" role="img" aria-label={title}>{icon}</span>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        </div>
        <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-md ${
          critical ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {number}
        </span>
      </div>
      <div className="text-slate-600 text-sm leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-4 space-y-2">
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-3 text-sm text-slate-600 items-start">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">
            {idx + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function AlertBox({ type, children }: { type: 'warning' | 'tip'; children: React.ReactNode }) {
  const isWarning = type === 'warning'
  return (
    <div className={`mt-4 rounded-xl border p-4 flex gap-3 text-sm items-start ${
      isWarning 
        ? 'bg-amber-50 border-amber-200 text-amber-800' 
        : 'bg-green-50 border-green-200 text-green-800'
    }`}>
      <span className="text-base shrink-0 mt-0.5">{isWarning ? '⚠️' : '💡'}</span>
      <div>{children}</div>
    </div>
  )
}

function AlertList({ alerts }: { alerts: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {alerts.map((alert, idx) => (
        <li key={idx} className="flex gap-2.5 text-sm text-slate-600 items-start">
          <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
          <span>{alert}</span>
        </li>
      ))}
    </ul>
  )
}

export default function VerificarPage() {
  return (
    <div className="verify-guide max-w-2xl mx-auto px-4 py-12">
      <div className="guide-header mb-10 text-center">
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
          Guía de Seguridad
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">
          Cómo verificar un smartphone antes de comprarlo
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Guía completa para compradores en Venezuela. Sigue estos pasos
          antes de cerrar cualquier trato para protegerte de estafas.
        </p>
      </div>

      {/* Sección 1 — Verificar el IMEI */}
      <GuideSection
        number="01"
        title="Verifica el IMEI"
        icon="📋"
        critical
      >
        <p>
          El IMEI es el número de identidad único de cada dispositivo.
          Para obtenerlo, marca <code>*#06#</code> en el equipo.
          Debe coincidir con el que aparece en la caja y en Ajustes.
        </p>
        <StepList steps={[
          'Pide al vendedor que marque *#06# frente a ti y anota el IMEI.',
          'Verifica en imei.info o checkmend.com que no está reportado como robado.',
          'Confirma que el IMEI en pantalla coincide con el de la caja y la etiqueta física.',
          'Para Samsung: verifica en el sitio de tu operadora que no tiene deudas pendientes.',
        ]} />
      </GuideSection>

      {/* Sección 2 — Verificar iPhone específicamente */}
      <GuideSection number="02" title="Para iPhones: verificar iCloud" icon="🍎">
        <p>
          El bloqueo de iCloud (Activation Lock) es la trampa más común
          en la compra de iPhones usados. Un iPhone con iCloud activo
          es inútil sin la contraseña del dueño anterior.
        </p>
        <StepList steps={[
          'Ve a Ajustes → [Tu nombre] — debe mostrar el Apple ID del vendedor, no el tuyo.',
          'Pide al vendedor que cierre sesión de iCloud frente a ti antes de pagar.',
          'Después del cierre de sesión, ve a Ajustes → General → Transferir o restablecer → Borrar contenido.',
          'Si pide contraseña de iCloud al borrar, el equipo AÚN está vinculado — no compres.',
          'Verifica en icloud.com/activationlock que el equipo no está bloqueado.',
        ]} />
        <AlertBox type="warning">
          Nunca pagues antes de ver el iPhone restaurado de fábrica y sin
          asociación a ninguna cuenta de Apple.
        </AlertBox>
      </GuideSection>

      {/* Sección 3 — Samsung FRP */}
      <GuideSection number="03" title="Para Samsung: verificar FRP" icon="🤖">
        <p>
          El FRP (Factory Reset Protection) de Samsung funciona similar
          al iCloud Lock. Si el equipo fue restablecido con una cuenta
          activa, pedirá esa cuenta al configurarlo.
        </p>
        <StepList steps={[
          'Pide al vendedor que elimine su cuenta de Samsung y Google antes de borrar el equipo.',
          'Ve a Ajustes → Cuentas y copia de seguridad → Administrar cuentas → eliminar todas.',
          'Luego Ajustes → Administración general → Restablecer → Restablecer datos de fábrica.',
          'Configura el equipo como nuevo — si pide cuenta Google anterior, tiene FRP activo.',
        ]} />
      </GuideSection>

      {/* Sección 4 — Verificar la batería */}
      <GuideSection number="04" title="Verifica el estado de la batería" icon="🔋">
        <StepList steps={[
          'iPhone: Ajustes → Batería → Estado de la batería y carga → confirma el porcentaje.',
          'Samsung: Ajustes → Cuidado del dispositivo → Batería → ver ciclos o porcentaje.',
          'Pide una captura de pantalla antes del encuentro y verifica que coincide en persona.',
          'Compara la batería con el precio — una batería bajo 80% debería reflejarse en el precio.',
        ]} />
      </GuideSection>

      {/* Sección 5 — Verificar la pantalla */}
      <GuideSection number="05" title="Verifica la pantalla" icon="📱">
        <StepList steps={[
          'Abre una imagen completamente blanca y completamente negra para detectar píxeles muertos.',
          'Revisa los bordes de la pantalla — si hay separación, fue cambiada.',
          'En iPhones desde el 12: ve a Ajustes → General → Acerca de — si dice "Unable to verify", la pantalla no es original de Apple.',
          'Prueba el touch en toda la superficie, especialmente las esquinas.',
          'Revisa que Face ID o Touch ID funcionen correctamente.',
        ]} />
      </GuideSection>

      {/* Sección 6 — Verificar la cámara */}
      <GuideSection number="06" title="Verifica la cámara" icon="📷">
        <StepList steps={[
          'Prueba todas las cámaras (frontal, trasera principal, ultra gran angular, teleobjetivo).',
          'Graba un video y revisa que el estabilizador funcione.',
          'Verifica que el flash funciona.',
          'En iPhones: Ajustes → General → Acerca de — si dice "Unable to verify" en cámara, fue reemplazada.',
        ]} />
      </GuideSection>

      {/* Sección 7 — El encuentro seguro */}
      <GuideSection number="07" title="El encuentro presencial" icon="🤝">
        <StepList steps={[
          'Usa siempre un punto de encuentro público con vigilancia — consulta las Zonas Seguras de Cambialo.',
          'Nunca vayas solo a casa del vendedor ni le permitas venir a la tuya.',
          'Inspecciona el equipo completamente antes de pagar — una vez pagado es difícil reclamar.',
          'Si el vendedor se niega a esperar que termines la verificación, es señal de alerta.',
          'Paga solo cuando estés 100% satisfecho con el equipo.',
        ]} />
        <AlertBox type="tip">
          Los tratos legítimos no tienen prisa. Un vendedor honesto entiende
          que necesitas verificar el equipo con calma.
        </AlertBox>
      </GuideSection>

      {/* Sección 8 — Señales de alerta */}
      <GuideSection number="08" title="Señales de alerta" icon="⚠️" critical>
        <AlertList alerts={[
          'Precio muy por debajo del mercado sin justificación clara.',
          'El vendedor evita mostrar el IMEI o el Apple ID.',
          'Se niega a hacer la videollamada de verificación.',
          'Insiste en que pagues primero y recojas después.',
          'No tiene historial de ventas en Cambialo.',
          'Presiona para cerrar el trato rápido.',
          'Las fotos del listing se ven sacadas de internet.',
          'El equipo está "en proceso de desbloqueo".',
        ]} />
      </GuideSection>

      {/* CTA final */}
      <div className="guide-footer mt-12 text-center border-t border-slate-100 pt-8 space-y-4">
        <p className="text-sm text-slate-500">
          ¿Encontraste algo sospechoso? Repórtalo desde el perfil del vendedor.
          Tu reporte ayuda a proteger a otros compradores.
        </p>
        <Link 
          href="/explore" 
          className="inline-block rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
        >
          Explorar equipos verificados
        </Link>
      </div>
    </div>
  )
}
