'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: '¿Cambialo maneja los pagos?',
    a: 'No. Los acuerdos de pago son directamente entre comprador y vendedor. Cambialo es la capa de confianza, no el intermediario financiero.',
  },
  {
    q: '¿Qué significa que un equipo está verificado?',
    a: 'El vendedor subió una foto del equipo físico junto a un código único generado por Cambialo, en tiempo real. Eso confirma que el equipo existe y está en sus manos.',
  },
  {
    q: '¿Qué pasa si me estafan?',
    a: 'Puedes reportar al vendedor desde su perfil. Los reportes van directamente a nuestro equipo de moderación. Los vendedores con reportes confirmados son baneados permanentemente.',
  },
  {
    q: '¿Cómo funciona el badge de Vendedor Verificado?',
    a: 'Debes verificar tu identidad con una foto de tu cédula y una selfie. Nuestro equipo revisa la solicitud en menos de 4 horas.',
  },
  {
    q: '¿Puedo vender desde cualquier estado de Venezuela?',
    a: 'Sí. Los encuentros se coordinan directamente entre las partes. Recomendamos nuestro directorio de Zonas Seguras para los intercambios.',
  },
  {
    q: '¿Cambialo tiene app móvil?',
    a: 'Por ahora es una PWA — puedes instalarla desde el navegador en tu teléfono y funciona como una app nativa. La app en tiendas está en nuestro roadmap.',
  },
  {
    q: '¿Cuánto cuesta publicar?',
    a: 'Publicar es gratis. Ofrecemos opciones de destacado y verificación de vendedor para quienes quieran más visibilidad.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-900">{q}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-600 leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      {/* Header */}
      <div className="mb-12 text-center">
        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 mb-4">
          Respuestas rápidas
        </span>
        <h1 className="text-4xl font-bold text-slate-900">Preguntas frecuentes</h1>
        <p className="mt-4 text-slate-600">
          Todo lo que necesitas saber para comprar o vender en Cambialo.
        </p>
      </div>

      {/* Acordeón */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6">
        {FAQS.map((faq) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>

      {/* CTA */}
      <p className="mt-10 text-center text-sm text-slate-500">
        ¿No encontraste tu respuesta?{' '}
        <a href="mailto:hola@cambialo.app" className="font-medium text-green-600 hover:text-green-700">
          Escríbenos
        </a>
        .
      </p>
    </div>
  )
}
