import Link from 'next/link'

const NAV_LINKS = [
  { href: '/macro',    label: 'Macro' },
  { href: '/markets',  label: 'Markets' },
  { href: '/labor',    label: 'Labor' },
  { href: '/housing',  label: 'Housing' },
  { href: '/regional', label: 'Regional' },
] as const

export function NavBar() {
  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center gap-8">
      <Link href="/" className="font-bold text-lg tracking-tight">
        EconDash
      </Link>
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
