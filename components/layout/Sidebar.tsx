'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/helpers/cn'
import {
  LayoutDashboard,
  Bot,
  Globe,
  FileText,
  CalendarCheck,
  ScrollText,
  Users,
  Settings,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Botlar', href: '/bots', icon: Bot },
  { name: 'Ülkeler', href: '/countries', icon: Globe },
  { name: 'Başvurular', href: '/applications', icon: FileText },
  { name: 'Randevular', href: '/appointments', icon: CalendarCheck },
  { name: 'Loglar', href: '/logs', icon: ScrollText },
  { name: 'Hesaplar', href: '/accounts', icon: Users },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 flex flex-col z-30 transition-transform duration-300 ease-in-out',
          'bg-[#0B1426]',
          'lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Vize Randevu</p>
              <p className="text-slate-500 text-xs">Otomasyon Paneli</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-white transition-colors p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="bg-white/5 rounded-lg px-3 py-2.5 flex items-center gap-2.5 border border-white/5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
            <span className="text-xs text-slate-400 flex-1">Sistem Aktif</span>
            <span className="text-xs text-emerald-400 font-semibold">3/5 Bot</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 py-2 mt-1">
            Yönetim
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/6'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 font-medium">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Admin</p>
              <p className="text-slate-500 text-xs truncate">admin@vizerandevu.com</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
