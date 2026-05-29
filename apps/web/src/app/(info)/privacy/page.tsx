import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo Cambialo recopila, usa y protege tu información personal.',
}

const sections = [
  {
    title: '1. Información que recopilamos',
    content: (
      <>
        <p className="font-medium text-slate-800 mb-2">Información que nos proporcionas directamente:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Nombre completo, nombre de usuario y dirección de correo electrónico al registrarte.</li>
          <li>Número de teléfono de WhatsApp si decides compartirlo.</li>
          <li>Foto de perfil, biografía y enlaces a redes sociales si decides agregarlos.</li>
          <li>Información de tus publicaciones: modelo del equipo, precio, condición, fotos y descripción.</li>
          <li>Documentos de identidad (cédula o pasaporte) si solicitas verificación KYC. Estos documentos se almacenan de forma encriptada y solo son accesibles por nuestro equipo de moderación para el proceso de verificación.</li>
          <li>Métodos de pago que eliges mostrar públicamente (Zelle, USDT, Pago Móvil, etc.). Esta información es voluntaria y la controlas tú.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Información que recopilamos automáticamente:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Dirección IP y tipo de dispositivo para seguridad y detección de fraude.</li>
          <li>Coordenadas de ubicación aproximada si otorgas permiso, para mostrar publicaciones cercanas. Esta información se almacena en sesión y no se guarda permanentemente sin tu consentimiento.</li>
          <li>Métricas de uso anónimas: páginas visitadas, tiempo en la plataforma, funciones utilizadas. Usamos Posthog para esto y los datos están anonimizados.</li>
          <li>Registros de errores técnicos a través de Sentry para mejorar la estabilidad de la plataforma.</li>
        </ul>
      </>
    ),
  },
  {
    title: '2. Cómo usamos tu información',
    content: (
      <>
        <p className="mb-3">Usamos la información recopilada para:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Crear y gestionar tu cuenta.</li>
          <li>Mostrar tus publicaciones a compradores potenciales.</li>
          <li>Verificar tu identidad y prevenir el fraude.</li>
          <li>Enviarte notificaciones relacionadas con tu actividad en la plataforma (verificación de publicaciones, reseñas, alertas de búsqueda).</li>
          <li>Mejorar la experiencia de usuario y corregir errores técnicos.</li>
          <li>Calcular índices de precios de mercado basados en publicaciones activas.</li>
        </ul>
        <p className="font-medium text-slate-800 mb-2">Lo que NO hacemos con tu información:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>No vendemos tu información personal a terceros.</li>
          <li>No compartimos tus datos con anunciantes.</li>
          <li>No usamos tus datos para publicidad personalizada fuera de Cambialo.</li>
          <li>No accedemos a tus documentos de identidad salvo para el proceso de verificación KYC.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Cómo compartimos tu información',
    content: (
      <>
        <p className="font-medium text-slate-800 mb-2">Información pública:</p>
        <p className="mb-4">Tu nombre de usuario, foto de perfil, ciudad, reputación, historial de ventas y las publicaciones que crees son visibles para cualquier visitante de la plataforma. La información de contacto (WhatsApp, métodos de pago) solo es visible si tú eliges hacerla pública desde tus ajustes.</p>
        <p className="font-medium text-slate-800 mb-2">Servicios de terceros:</p>
        <p className="mb-3">Usamos los siguientes servicios para operar la plataforma:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Supabase</strong> — almacenamiento de datos y autenticación.</li>
          <li><strong>Cloudinary</strong> — almacenamiento y optimización de imágenes.</li>
          <li><strong>Resend</strong> — envío de correos electrónicos transaccionales.</li>
          <li><strong>Sentry</strong> — monitoreo de errores técnicos.</li>
          <li><strong>Posthog</strong> — análisis de uso anónimo.</li>
        </ul>
        <p className="mb-4">Cada uno de estos servicios tiene sus propias políticas de privacidad y estamos comprometidos a usar únicamente proveedores que cumplan con estándares de seguridad adecuados.</p>
        <p className="font-medium text-slate-800 mb-2">Requerimientos legales:</p>
        <p>Podemos divulgar información si creemos de buena fe que es necesario para cumplir con una obligación legal, proteger la seguridad de los usuarios o prevenir el fraude.</p>
      </>
    ),
  },
  {
    title: '4. Seguridad de tu información',
    content: (
      <>
        <p className="mb-3">Implementamos medidas de seguridad técnicas para proteger tu información:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Conexiones encriptadas (HTTPS) en toda la plataforma.</li>
          <li>Políticas de seguridad a nivel de base de datos (Row Level Security).</li>
          <li>Documentos de identidad almacenados encriptados en almacenamiento privado.</li>
          <li>Autenticación de dos factores disponible y obligatoria para cuentas con roles administrativos.</li>
          <li>Acceso restringido a datos sensibles solo para personal autorizado.</li>
        </ul>
        <p>Sin embargo, ningún sistema es 100% seguro. Te recomendamos usar una contraseña única y activar la verificación en dos pasos desde tus ajustes.</p>
      </>
    ),
  },
  {
    title: '5. Tus derechos',
    content: (
      <>
        <p className="mb-3">Tienes derecho a:</p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Acceder</strong> a la información que tenemos sobre ti desde tu perfil y ajustes.</li>
          <li><strong>Corregir</strong> información incorrecta editando tu perfil.</li>
          <li><strong>Eliminar</strong> tu cuenta y toda tu información personal desde Ajustes → Zona de peligro → Eliminar cuenta. La eliminación es permanente e irreversible.</li>
          <li><strong>Exportar</strong> tus datos contactándonos a soporte@cambialo.app.</li>
          <li><strong>Retirar el consentimiento</strong> de ubicación en cualquier momento desde la configuración de tu navegador o dispositivo.</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, escríbenos a <a href="mailto:soporte@cambialo.app" className="text-green-600 hover:text-green-700 underline">soporte@cambialo.app</a>.</p>
      </>
    ),
  },
  {
    title: '6. Retención de datos',
    content: (
      <>
        <p className="mb-3">Conservamos tu información mientras tu cuenta esté activa. Al eliminar tu cuenta:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tu perfil público desaparece inmediatamente.</li>
          <li>Tus datos personales se eliminan en un plazo de 30 días.</li>
          <li>Los documentos de identidad (KYC) se eliminan en un plazo de 7 días.</li>
          <li>Las publicaciones vendidas pueden conservarse de forma anonimizada para el índice de precios histórico.</li>
        </ul>
      </>
    ),
  },
  {
    title: '7. Menores de edad',
    content: (
      <p>Cambialo no está dirigido a personas menores de 18 años. Si tienes menos de 18 años, no debes registrarte ni usar la plataforma. Si descubrimos que un usuario menor de edad ha creado una cuenta, la eliminaremos de inmediato.</p>
    ),
  },
  {
    title: '8. Cambios a esta política',
    content: (
      <p>Podemos actualizar esta política ocasionalmente. Te notificaremos por correo electrónico si los cambios son significativos. La fecha de &quot;última actualización&quot; al inicio de este documento siempre refleja la versión vigente.</p>
    ),
  },
  {
    title: '9. Contacto',
    content: (
      <p>Si tienes preguntas sobre esta política de privacidad, escríbenos a: <a href="mailto:soporte@cambialo.app" className="text-green-600 hover:text-green-700 underline">soporte@cambialo.app</a></p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Política de Privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: Mayo 2026</p>
        <p className="mt-4 text-slate-600 leading-relaxed">
          En Cambialo nos tomamos tu privacidad en serio. Esta política explica qué información
          recopilamos, cómo la usamos y cómo la protegemos cuando usas nuestra plataforma en cambialo.app.
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
