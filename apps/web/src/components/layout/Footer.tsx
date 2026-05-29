import Link from 'next/link'

const LINKS = [
  { href: '/explore', label: 'Explorar' },
  { href: '/sell', label: 'Publicar' },
  { href: '/about', label: 'Quiénes somos' },
  { href: '/faq', label: 'FAQ' },
  { href: '/roadmap', label: 'Roadmap' },
  { href: '/privacy', label: 'Privacidad' },
  { href: '/terms', label: 'Términos' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <Link href="/" className="text-lg font-bold text-green-600 shrink-0">
            Cambialo
          </Link>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-slate-700 whitespace-nowrap">
                {l.label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-slate-400 shrink-0">© 2026 Cambialo</p>
        </div>
      </div>
    </footer>
  )
}
