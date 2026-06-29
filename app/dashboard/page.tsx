'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/helpers/cn'
import { Bot, CalendarCheck, Users, Bell, TrendingUp, Clock, Activity, Database } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  totalAccounts: number
  activeBots: number
  runningBots: number
  totalBots: number
  availableAppointments: number
  bookedAppointments: number
  unreadNotifications: number
}

interface RecentLog {
  id: number
  level: string
  message: string
  created_at: string
  bots: { name: string } | null
}

interface RecentAppointment {
  id: string
  country: string
  city: string | null
  visa_type: string | null
  appointment_date: string
  appointment_time: string | null
  status: string
  created_at: string
}

const LEVEL_COLORS: Record<string, string> = {
  info:    'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  success: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
  error:   'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: typeof Bot; label: string; value: number | string
  sub?: string; color: string; href?: string
}) {
  const card = (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5" />
        </div>
        {href && <span className="text-xs text-blue-500">→</span>}
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{card}</Link> : card
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
        <Database className="w-8 h-8 text-slate-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Henüz veri yok</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Sistemi kullanmaya başlamak için önce bir VFS hesabı ekleyin, ardından bot oluşturun.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/accounts" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
          Hesap Ekle
        </Link>
        <Link href="/bots" className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          Bot Oluştur
        </Link>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])
  const [recentAppts, setRecentAppts] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient()
      const [
        { count: totalAccounts },
        { data: bots },
        { data: appointmentData },
        { count: unreadCount },
        { data: logs },
        { data: appts },
      ] = await Promise.all([
        supabase.from('visa_accounts').select('*', { count: 'exact', head: true }),
        supabase.from('bots').select('status'),
        supabase.from('appointments').select('status'),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('bot_logs').select('id, level, message, created_at, bots(name)').order('created_at', { ascending: false }).limit(8),
        supabase.from('appointments').select('id, country, city, visa_type, appointment_date, appointment_time, status, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({
        totalAccounts: totalAccounts ?? 0,
        activeBots:    (bots ?? []).filter(b => b.status !== 'error').length,
        runningBots:   (bots ?? []).filter(b => b.status === 'running').length,
        totalBots:     (bots ?? []).length,
        availableAppointments: (appointmentData ?? []).filter(a => a.status === 'available').length,
        bookedAppointments:    (appointmentData ?? []).filter(a => a.status === 'booked').length,
        unreadNotifications: unreadCount ?? 0,
      })
      setRecentLogs((logs ?? []) as unknown as RecentLog[])
      setRecentAppts((appts ?? []) as unknown as RecentAppointment[])
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 h-28" />
        ))}
      </div>
    )
  }

  if (!stats || (stats.totalAccounts === 0 && stats.totalBots === 0)) {
    return <EmptyDashboard />
  }

  return (
    <div className="space-y-6">
      {/* KPI kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="VFS Hesap"        value={stats.totalAccounts}            sub="Toplam kayıtlı hesap"     color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"         href="/accounts" />
        <StatCard icon={Bot}           label="Aktif Bot"         value={`${stats.runningBots}/${stats.totalBots}`} sub="Şu an çalışıyor"  color="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" href="/bots" />
        <StatCard icon={CalendarCheck} label="Müsait Randevu"   value={stats.availableAppointments}    sub={`${stats.bookedAppointments} rezerve edildi`} color="bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400" href="/appointments" />
        <StatCard icon={Bell}          label="Okunmamış Bildirim" value={stats.unreadNotifications}   sub="Bekleyen uyarılar"        color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"         href="/notifications" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Son loglar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Son Bot Logları</h3>
            </div>
            <Link href="/logs" className="text-xs text-blue-500 hover:underline">Tümünü Gör</Link>
          </div>
          {recentLogs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Henüz log kaydı yok</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentLogs.map(log => (
                <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5', LEVEL_COLORS[log.level] ?? LEVEL_COLORS.info)}>
                    {log.level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{log.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {log.bots?.name ?? 'Bilinmeyen bot'} · {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son randevular */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Son Bulunan Randevular</h3>
            </div>
            <Link href="/appointments" className="text-xs text-blue-500 hover:underline">Tümünü Gör</Link>
          </div>
          {recentAppts.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Henüz randevu bulunamadı</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentAppts.map(appt => (
                <div key={appt.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {appt.country} {appt.city ? `— ${appt.city}` : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {appt.appointment_date} {appt.appointment_time ?? ''}
                      </span>
                      {appt.visa_type && (
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{appt.visa_type}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={appt.status === 'available' ? 'success' : appt.status === 'booked' ? 'info' : 'default'} dot>
                    {appt.status === 'available' ? 'Müsait' : appt.status === 'booked' ? 'Rezerve' : 'Süresi Doldu'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hızlı erişim */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />Hızlı Erişim
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Hesap Ekle',   href: '/accounts',    color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'         },
            { label: 'Bot Oluştur',  href: '/bots',        color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
            { label: 'Logları Gör',  href: '/logs',        color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'       },
            { label: 'Analitik',     href: '/analytics',   color: 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'   },
          ].map(item => (
            <Link key={item.href} href={item.href} className={cn('rounded-xl p-3 text-sm font-semibold text-center hover:opacity-80 transition-opacity', item.color)}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
