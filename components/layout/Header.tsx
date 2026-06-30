'use client'

import { useEffect, useState } from 'react'
import { Bell, Menu } from 'lucide-react'
import { DarkModeToggle } from './DarkModeToggle'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/helpers/cn'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuClick: () => void
  title: string
  subtitle?: string
}

export function Header({ onMenuClick, title, subtitle }: HeaderProps) {
  const [initials,  setInitials]  = useState('?')
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [unread,    setUnread]    = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
      ])

      const name = profile?.full_name ?? user.email?.split('@')[0] ?? ''
      const parts = name.trim().split(' ')
      const ini = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase()

      setInitials(ini || '?')
      setIsAdmin(profile?.role === 'admin')
      setUnread(count ?? 0)
    }
    fetchUser()
  }, [])

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Menüyü aç"
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Mobilde logo + isim görünür, masaüstünde gizlenir */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
            <Image src="/images/logo.jpeg" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">MK Digital Systems</span>
        </div>
        {/* Masaüstünde sayfa başlığı görünür */}
        <div className="hidden lg:block">
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DarkModeToggle />

        {/* Bildirim zili */}
        <Link href="/notifications" className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* Profil avatarı */}
        <Link href="/profile" title="Profilim" className="ml-1">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm hover:ring-2 hover:ring-blue-400 transition-all',
            isAdmin
              ? 'bg-gradient-to-br from-amber-400 to-orange-600'
              : 'bg-gradient-to-br from-blue-500 to-blue-700'
          )}>
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}
