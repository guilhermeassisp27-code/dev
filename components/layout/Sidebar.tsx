'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  TrendingUp,
} from 'lucide-react'

const navItems = [
  { href: '/pipeline', label: 'Pipeline', icon: LayoutDashboard },
  { href: '/briefing', label: 'Briefing', icon: FileText },
  { href: '/mensagens', label: 'Mensagens', icon: MessageSquare },
  { href: '/semana', label: 'Minha Semana', icon: Calendar },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/config', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Sales Co-Pilot</p>
          <p className="text-xs text-muted-foreground mt-0.5">Becomex</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-primary' : '')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Becomex &copy; {new Date().getFullYear()}</p>
      </div>
    </aside>
  )
}
