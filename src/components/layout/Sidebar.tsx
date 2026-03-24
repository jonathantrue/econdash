'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/',         label: 'Overview' },
  { href: '/macro',    label: 'Macro' },
  { href: '/markets',  label: 'Markets' },
  { href: '/labor',    label: 'Labor' },
  { href: '/housing',  label: 'Housing' },
  { href: '/regional', label: 'Regional' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-8 h-[calc(100vh-32px)] w-60
                      bg-surface-low flex flex-col p-5 z-50 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 bg-primary-container rounded flex items-center
                        justify-center text-white flex-shrink-0" />
        <div>
          <p className="font-headline font-extrabold text-[13px] text-primary
                        leading-tight tracking-tight">Federal Intelligence</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase
                        tracking-[2px] mt-0.5">Economic Command Center</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold
                        uppercase tracking-wide transition-all ${
              isActive(href)
                ? 'bg-surface-lowest text-primary shadow-[0_2px_8px_rgba(23,28,31,0.07)] rounded-[4px_0_0_4px]'
                : 'text-muted-foreground hover:text-primary hover:bg-surface-high/50 rounded'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 shadow-[0_-1px_0_rgba(195,198,209,0.15)] space-y-1">
        <button className="w-full bg-gradient-to-br from-primary to-primary-container
                           text-white text-[10px] font-bold uppercase tracking-widest
                           rounded py-2.5 mb-3 hover:opacity-90 transition-opacity">
          Export Global Data
        </button>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-[10px] font-bold
                               uppercase tracking-wide text-muted-foreground
                               hover:text-primary transition-colors">
          Help Center
        </a>
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-[10px] font-bold
                               uppercase tracking-wide text-muted-foreground
                               hover:text-primary transition-colors">
          Documentation
        </a>
      </div>
    </aside>
  )
}
