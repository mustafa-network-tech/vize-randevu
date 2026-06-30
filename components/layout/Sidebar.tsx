'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/helpers/cn'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Bot, Globe, FileText, CalendarCheck,
  ScrollText, Users, Settings, ChevronRight, Zap, X,
  Shield, Fingerprint, CalendarDays, BarChart3, Bell, UserCog,
  LogOut, UserCheck, Crown, MonitorPlay,
} from 'lucide-react'

// adminOnly: true → sadece admin görür
// adminOnly: false veya yok → herkes görür
const NAV_SECTIONS = [
  {
    label: 'Genel Bakış',
    items: [
      { name: 'Dashboard',      href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
      { name: 'Canlı İzleme',   href: '/monitor',   icon: MonitorPlay,     adminOnly: true  },
      { name: 'Analitik',       href: '/analytics', icon: BarChart3,       adminOnly: true  },
    ],
  },
  {
    label: 'Otomasyon',
    items: [
      { name: 'Botlar',      href: '/bots',         icon: Bot,             adminOnly: false },
      { name: 'Ülkeler',     href: '/countries',    icon: Globe,           adminOnly: true  },
      { name: 'Zamanlayıcı', href: '/scheduler',    icon: CalendarDays,    adminOnly: true  },
    ],
  },
  {
    label: 'Randevu',
    items: [
      { name: 'Hesaplar',    href: '/accounts',     icon: Users,           adminOnly: false },
      { name: 'Başvuranlar', href: '/applicants',   icon: UserCheck,       adminOnly: false },
      { name: 'Randevular',  href: '/appointments', icon: CalendarCheck,   adminOnly: false },
      { name: 'Başvurular',  href: '/applications', icon: FileText,        adminOnly: false },
    ],
  },
  {
    label: 'Altyapı',
    adminOnly: true,
    items: [
      { name: 'Proxy',       href: '/proxy',        icon: Shield,          adminOnly: true  },
      { name: 'CAPTCHA',     href: '/captcha',      icon: Fingerprint,     adminOnly: true  },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { name: 'Bildirimler', href: '/notifications', icon: Bell,           adminOnly: false },
      { name: 'Loglar',      href: '/logs',          icon: ScrollText,     adminOnly: false },
      { name: 'Personel',    href: '/users',         icon: UserCog,        adminOnly: true  },
      { name: 'Ayarlar',     href: '/settings',      icon: Settings,       adminOnly: false },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface UserProfile {
  full_name: string | null
  role: 'admin' | 'user'
  email: string
  initial: string
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [botStats, setBotStats] = useState({ running: 0, total: 0 })

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: bots }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('bots').select('status'),
      ])

      const name = prof?.full_name ?? user.email?.split('@')[0] ?? 'Kullanıcı'
      setProfile({
        full_name: name,
        role: prof?.role ?? 'user',
        email: user.email ?? '',
        initial: name.charAt(0).toUpperCase(),
      })

      const allBots = bots ?? []
      setBotStats({ running: allBots.filter((b: {status: string}) => b.status === 'running').length, total: allBots.length })
    }
    fetchProfile()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 flex flex-col z-30 transition-transform duration-300 ease-in-out',
        'bg-[#0B1426] dark:bg-[#060d1a]',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
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
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rol rozeti + sistem durumu */}
        <div className="px-4 py-3 space-y-2">
          {/* Rol göstergesi */}
          {profile && (
            <div className={cn(
              'rounded-lg px-3 py-2 flex items-center gap-2 border text-xs font-semibold',
              isAdmin
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            )}>
              <Crown className="w-3.5 h-3.5 flex-shrink-0" />
              {isAdmin ? 'Admin — Tam Yetki' : 'Kullanıcı'}
            </div>
          )}
          {/* Bot durumu */}
          <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center gap-2.5 border border-white/5">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', botStats.running > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600')} />
            <span className="text-xs text-slate-400 flex-1">Bot Durumu</span>
            <span className={cn('text-xs font-semibold', botStats.running > 0 ? 'text-emerald-400' : 'text-slate-500')}>
              {botStats.running}/{botStats.total}
            </span>
          </div>
        </div>

        {/* Navigasyon */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {NAV_SECTIONS.map(section => {
            // Bölüm tamamen admin'e özelse ve kullanıcı admin değilse gizle
            if ((section as {adminOnly?: boolean}).adminOnly && !isAdmin) return null

            // Bölümdeki admin-only item'ları filtrele
            const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
            if (visibleItems.length === 0) return null

            return (
              <div key={section.label} className="mb-1">
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 py-2 mt-1">
                  {section.label}
                </p>
                {visibleItems.map(item => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
              </div>
            )
          })}
        </nav>

        {/* Kullanıcı + Çıkış */}
        <div className="p-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow',
              isAdmin
                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-700'
            )}>
              {profile?.initial ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name ?? '...'}</p>
              <p className="text-slate-500 text-xs truncate">{profile?.email ?? ''}</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Çıkış Yap"
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-white/8 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
