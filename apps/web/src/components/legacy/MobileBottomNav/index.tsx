'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, Book, User, Briefcase, FileText } from 'lucide-react'

const navItems = [
  {
    name: 'Inicio',
    href: '/',
    icon: Home,
  },
  {
    name: 'Catálogo',
    href: '/catalog',
    icon: Book,
  },
  {
    name: 'Casos',
    href: '/cases',
    icon: Briefcase,
  },
  {
    name: 'Documentos',
    href: '/documents',
    icon: FileText,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary/20 z-50 backdrop-blur-md bg-primary/95">
      <div className="safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-primary-foreground bg-white/20 scale-105'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 active:scale-95'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-xs font-medium truncate ${isActive ? 'font-semibold' : ''}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}