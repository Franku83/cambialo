import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Conoce la historia y misión de Cambialo — el marketplace de smartphones verificados en Venezuela.',
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
          Nuestra historia
        </span>
        <h1 className="text-4xl font-bold text-slate-900 leading-tight">Quiénes somos</h1>
        <p className="mt-4 text-lg text-slate-600 leading-relaxed">
          Cambialo nació en 2026 con una misión simple: hacer que comprar y vender un smartphone
          en Venezuela sea tan seguro como hacerlo en persona con alguien de confianza.
        </p>
      </div>

      {/* Historia */}
      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed">
        <p>
          Somos un equipo venezolano que vivió de primera mano el caos de Facebook Marketplace
          y los grupos de WhatsApp: equipos que llegaban dañados, vendedores que desaparecían
          después del pago, y precios inflados sin forma de comparar.
        </p>
        <p>
          Decidimos construir la infraestructura que faltaba. No solo un tablón de anuncios,
          sino una capa de confianza real: verificación visual con foto en vivo, identidad
          confirmada de cada vendedor, y una reputación que no se puede borrar ni comprar.
        </p>
        <p>
          Cada equipo publicado en Cambialo pasó por un proceso de verificación. Cada vendedor
          confirmó quién es. Y cada transacción queda registrada en un historial permanente que
          protege tanto al comprador como al vendedor.
        </p>
      </div>

      {/* Misión */}
      <div className="mt-14 rounded-2xl border border-green-100 bg-green-50/50 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Nuestra misión</h2>
        <p className="text-slate-600 leading-relaxed">
          Ser la infraestructura de confianza del comercio tech venezolano.
        </p>
      </div>

      {/* Valores */}
      <div className="mt-14">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Nuestros valores</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: '🔒', title: 'Confianza primero', desc: 'Cada decisión de producto pasa por la pregunta: ¿esto hace la plataforma más segura?' },
            { icon: '📱', title: 'Mobile first', desc: 'Diseñado para el teléfono que ya tienes en la mano, no para el escritorio.' },
            { icon: '🇻🇪', title: 'Hecho para Venezuela', desc: 'Contexto local real — precios en USD, zonas seguras en tu ciudad, sin términos genéricos.' },
          ].map((v) => (
            <div key={v.title} className="rounded-xl border border-slate-200 bg-white p-5 text-center">
              <span className="text-3xl">{v.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-14 text-center">
        <a
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700"
        >
          Ver equipos verificados
        </a>
      </div>
    </div>
  )
}
