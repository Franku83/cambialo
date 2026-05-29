import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma Cambialo.',
}

const sections = [
  {
    title: '1. Qué es Cambialo',
    content: (
      <p>Cambialo es una plataforma digital que conecta a compradores y vendedores de smartphones de segunda mano en Venezuela. Cambialo actúa como intermediario de confianza y verificación, pero <strong>no es parte de ninguna transacción económica</strong> entre usuarios. Los acuerdos de precio, forma de pago y entrega son responsabilidad exclusiva de las partes involucradas.</p>
    ),
  },
  {
    title: '2. Elegibilidad',
    content: (
      <>
        <p className="mb-2">Para usar Cambialo debes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tener 18 años o más.</li>
          <li>Tener capacidad legal para celebrar contratos.</li>
          <li>No haber sido suspendido o baneado previamente de la plataforma.</li>
          <li>Proporcionar información veraz al registrarte.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Tu cuenta',
    content: (
      <>
        <p className="font-medium text-slate-800 mb-2">Responsabilidades:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
          <li>Eres responsable de toda la actividad que ocurra bajo tu cuenta.</li>
          <li>Debes notificarnos de inmediato a soporte@cambialo.app si sospechas acceso no autorizado.</li>
          <li>No puedes crear más de una cuenta personal. Las cuentas son intransferibles.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Verificación de identidad:</p>
        <p>La verificación KYC es voluntaria pero otorga beneficios adicionales (mayor límite de publicaciones, badge de confianza). Los documentos proporcionados son tratados con estricta confidencialidad según nuestra Política de Privacidad.</p>
      </>
    ),
  },
  {
    title: '4. Publicaciones',
    content: (
      <>
        <p className="font-medium text-slate-800 mb-2">Lo que puedes publicar:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Smartphones de segunda mano en cualquier condición, siempre que la descripción sea precisa.</li>
          <li>Solo equipos que sean de tu propiedad o que tengas autorización legal para vender.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Lo que está prohibido publicar:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Equipos robados o con procedencia ilícita.</li>
          <li>Equipos con bloqueo de iCloud o Google Lock sin declararlo explícitamente.</li>
          <li>Equipos con IMEI reportado como robado.</li>
          <li>Información falsa sobre el estado, batería, modelo o especificaciones del equipo.</li>
          <li>Precios engañosos o con condiciones ocultas.</li>
          <li>Contenido ofensivo, discriminatorio o ilegal en la descripción.</li>
          <li>Publicaciones con datos de contacto en el título o descripción para evadir la plataforma.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Proceso de verificación:</p>
        <p className="mb-3">Las publicaciones pasan por revisión antes de ser visibles en el feed. Cambialo se reserva el derecho de rechazar o remover cualquier publicación que viole estas normas sin previo aviso.</p>
        <p className="font-medium text-slate-800 mb-2">Duración:</p>
        <p>Las publicaciones activas expiran a los 60 días. Puedes renovarlas desde tu panel de vendedor.</p>
      </>
    ),
  },
  {
    title: '5. Transacciones',
    content: (
      <>
        <p className="font-semibold text-slate-800 mb-3">Cambialo no maneja pagos.</p>
        <p className="mb-3">Todas las transacciones económicas ocurren directamente entre comprador y vendedor, fuera de la plataforma. Cambialo no:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Recibe, retiene ni transfiere dinero entre usuarios.</li>
          <li>Garantiza la realización de ningún pago.</li>
          <li>Es responsable de disputas económicas entre usuarios.</li>
          <li>Ofrece protección al comprador ni al vendedor en transacciones fallidas.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Recomendaciones de seguridad:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Realiza los intercambios en zonas públicas seguras. Consulta nuestro directorio de Zonas Seguras.</li>
          <li>Inspecciona el equipo antes de realizar cualquier pago.</li>
          <li>Verifica el IMEI del equipo antes de cerrar el trato.</li>
          <li>Ante cualquier sospecha de fraude, no realices el pago y repórtalo.</li>
        </ul>
      </>
    ),
  },
  {
    title: '6. Reputación y reseñas',
    content: (
      <p>Las reseñas en Cambialo son permanentes y no pueden ser eliminadas por los usuarios. Reflejan la experiencia real de compradores y vendedores. Solo puedes dejar una reseña por transacción. Las reseñas falsas, manipuladas o que contengan información personal de terceros serán eliminadas y pueden resultar en la suspensión de la cuenta.</p>
    ),
  },
  {
    title: '7. Conducta prohibida',
    content: (
      <>
        <p className="mb-2">Está estrictamente prohibido:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Intentar estafar, engañar o defraudar a otros usuarios.</li>
          <li>Acosar, amenazar o intimidar a otros usuarios.</li>
          <li>Crear cuentas falsas o suplantar identidades.</li>
          <li>Manipular el sistema de reputación.</li>
          <li>Usar la plataforma para actividades ilegales.</li>
          <li>Intentar acceder sin autorización a cuentas de otros usuarios o a los sistemas de Cambialo.</li>
          <li>Hacer scraping automatizado de datos de la plataforma.</li>
          <li>Publicar contenido que viole derechos de propiedad intelectual.</li>
        </ul>
      </>
    ),
  },
  {
    title: '8. Suspensiones y baneos',
    content: (
      <>
        <p className="mb-3">Cambialo se reserva el derecho de suspender o banear cuentas que violen estos términos. Las suspensiones pueden ser temporales o permanentes según la gravedad de la infracción.</p>
        <p className="font-medium text-slate-800 mb-2">Causas de baneo permanente:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Fraude comprobado.</li>
          <li>Venta de equipos robados.</li>
          <li>Suplantación de identidad.</li>
          <li>Múltiples infracciones graves.</li>
        </ul>
        <p>Los usuarios baneados no pueden registrarse nuevamente con el mismo correo electrónico. Los baneos son apelables escribiendo a <a href="mailto:soporte@cambialo.app" className="text-green-600 underline hover:text-green-700">soporte@cambialo.app</a> con evidencia que justifique la revisión.</p>
      </>
    ),
  },
  {
    title: '9. Propiedad intelectual',
    content: (
      <p>El nombre Cambialo, el logo, el diseño de la plataforma y todo el contenido creado por Cambialo son propiedad del proyecto. No puedes usar, copiar, modificar ni distribuir ninguno de estos elementos sin autorización expresa. El contenido que tú publicas (fotos, descripciones) sigue siendo tuyo. Al publicarlo en Cambialo nos otorgas una licencia no exclusiva para mostrarlo en la plataforma y en materiales promocionales de Cambialo.</p>
    ),
  },
  {
    title: '10. Limitación de responsabilidad',
    content: (
      <>
        <p className="mb-3">Cambialo no es responsable por:</p>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <li>Pérdidas económicas derivadas de transacciones entre usuarios.</li>
          <li>Equipos que no correspondan a la descripción publicada.</li>
          <li>Fraudes cometidos por otros usuarios.</li>
          <li>Interrupciones del servicio por mantenimiento o causas técnicas.</li>
          <li>Daños indirectos, incidentales o consecuentes de cualquier tipo.</li>
        </ul>
        <p>Usas la plataforma bajo tu propio riesgo. Cambialo proporciona herramientas de verificación y confianza, pero no puede garantizar el comportamiento de todos los usuarios.</p>
      </>
    ),
  },
  {
    title: '11. Modificaciones al servicio',
    content: (
      <p>Cambialo se reserva el derecho de modificar, suspender o discontinuar cualquier parte del servicio en cualquier momento. También podemos modificar estos Términos y Condiciones. Los cambios significativos serán comunicados por correo electrónico con al menos 7 días de anticipación.</p>
    ),
  },
  {
    title: '12. Contacto',
    content: (
      <p>Para cualquier consulta sobre estos términos: <a href="mailto:soporte@cambialo.app" className="text-green-600 underline hover:text-green-700">soporte@cambialo.app</a></p>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Términos y Condiciones</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: Mayo 2026</p>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Bienvenido a Cambialo. Al acceder o usar nuestra plataforma en cambialo.app, aceptas estos
          Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debes
          usar la plataforma.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title} className="border-b border-slate-100 pb-8 last:border-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">{s.title}</h2>
            <div className="text-sm text-slate-600 leading-relaxed">{s.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
