'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/helpers/cn'
import {
  Bot, CalendarCheck, Users, Bell, TrendingUp, Clock, Activity,
  Database, Cpu, LogIn, ShieldAlert, Globe, CheckCircle2,
  XCircle, Timer, BarChart3, Wifi, WifiOff,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

// ─── Tipler ──────────────────────────────────────────────────────────────────

interface BotStatus { running: number; paused: number; idle: number; error: number; total: number }
interface BotMetrics {
  login_success: number; login_fail: number; slot_checks: number
  ip_blocks: number; captcha_events: number; appointments_found: number
}
interface EngineStatus {
  status: 'online' | 'offline'
  last_heartbeat: string | null
  started_at: string | null
  version: string | null
  worker_count: number | null
}
interface DailyMetric {
  date: string
  login_success: number; login_fail: number; slot_checks: number
  ip_blocks: number; appointments_found: number
}
interface RecentLog {
  id: number; level: string; message: string; created_at: string
  bots: { name: string } | null
}
interface RecentAppointment {
  id: string; country: string; city: string | null; visa_type: string | null
  appointment_date: string; appointment_time: string | null; status: string
}

// ─── Sabitler ────────────────────────────────────────────────────────────────

const OFFLINE_THRESHOLD_S = 120   // 2 dakika

const LOG_COLORS: Record<string, string> = {
  info:    'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  success: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400',
  error:   'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400',
}

// ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────

function secondsSince(isoStr: string | null): number {
  if (!isoStr) return Infinity
  return (Date.now() - new Date(isoStr).getTime()) / 1000
}

function isEngineOnline(engine: EngineStatus | null): boolean {
  if (!engine || engine.status !== 'online') return false
  return secondsSince(engine.last_heartbeat) < OFFLINE_THRESHOLD_S
}

function fmt(n: number): string { return n.toLocaleString('tr-TR') }

// Son 7 günün tarih listesi (YYYY-MM-DD)
function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function mergeDailyMetrics(raw: DailyMetric[]): DailyMetric[] {
  const days = last7Days()
  const map = Object.fromEntries(raw.map(r => [r.date, r]))
  return days.map(date => ({
    date: new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
    login_success: map[date]?.login_success ?? 0,
    login_fail:    map[date]?.login_fail ?? 0,
    slot_checks:   map[date]?.slot_checks ?? 0,
    ip_blocks:     map[date]?.ip_blocks ?? 0,
    appointments_found: map[date]?.appointments_found ?? 0,
  }))
}

// ─── Sub-bileşenler ──────────────────────────────────────────────────────────

function EngineStatusBar({ engine }: { engine: EngineStatus | null }) {
  const online = isEngineOnline(engine)
  const lastBeat = engine?.last_heartbeat ? new Date(engine.last_heartbeat) : null
  const secAgo = engine?.last_heartbeat ? Math.round(secondsSince(engine.last_heartbeat)) : null

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-4 rounded-xl border px-5 py-3.5 text-sm',
      online
        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
        : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
    )}>
      {/* Durum */}
      <div className="flex items-center gap-2">
        <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', online ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
        <Cpu className={cn('w-4 h-4', online ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')} />
        <span className={cn('font-bold', online ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400')}>
          Bot Engine {online ? 'Çevrimiçi' : 'Çevrimdışı'}
        </span>
      </div>

      <div className="h-4 w-px bg-current opacity-20" />

      {/* Son Heartbeat */}
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
        <Timer className="w-3.5 h-3.5" />
        <span className="text-xs">
          Son heartbeat:{' '}
          {lastBeat
            ? `${lastBeat.toLocaleTimeString('tr-TR')} (${secAgo}s önce)`
            : '—'}
        </span>
      </div>

      <div className="h-4 w-px bg-current opacity-20" />

      {/* Worker */}
      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
        <Activity className="w-3.5 h-3.5" />
        <span className="text-xs">
          Çalışan Worker: <span className="font-semibold text-slate-800 dark:text-slate-200">{engine?.worker_count ?? 0}</span>
        </span>
      </div>

      {engine?.started_at && (
        <>
          <div className="h-4 w-px bg-current opacity-20" />
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500 text-xs">
            <Clock className="w-3.5 h-3.5" />
            Başlangıç: {new Date(engine.started_at).toLocaleString('tr-TR')}
          </div>
        </>
      )}

      <div className="ml-auto">
        <Badge variant={online ? 'success' : 'error'} dot>v{engine?.version ?? '—'}</Badge>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color, iconBg }: {
  icon: typeof Bot; label: string; value: number | string
  sub?: string; color: string; iconBg: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{typeof value === 'number' ? fmt(value) : value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function BotStatusGrid({ botStatus }: { botStatus: BotStatus }) {
  const items = [
    { label: 'Çalışıyor', value: botStatus.running, dot: 'bg-emerald-500 animate-pulse', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Bekliyor',  value: botStatus.idle,    dot: 'bg-slate-400',                 text: 'text-slate-600 dark:text-slate-400' },
    { label: 'Duraklatıldı', value: botStatus.paused, dot: 'bg-amber-500',              text: 'text-amber-700 dark:text-amber-300' },
    { label: 'Hata',      value: botStatus.error,   dot: 'bg-red-500',                  text: 'text-red-700 dark:text-red-300' },
  ]
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bot Durumu</h3>
        <span className="ml-auto text-xs text-slate-400">Toplam: {botStatus.total}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', item.dot)} />
            <div>
              <p className={cn('text-base font-bold', item.text)}>{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
      <Link href="/bots" className="block mt-3 text-center text-xs text-blue-500 hover:underline">Botları Yönet →</Link>
    </div>
  )
}

function DailyChart({ data }: { data: DailyMetric[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">7 Günlük İstatistikler</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={10} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Legend
            iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>}
          />
          <Bar dataKey="login_success" name="Login Başarılı" fill="#10b981" radius={[3,3,0,0]} />
          <Bar dataKey="login_fail"    name="Login Hata"     fill="#f87171" radius={[3,3,0,0]} />
          <Bar dataKey="slot_checks"   name="Slot Kontrolü"  fill="#60a5fa" radius={[3,3,0,0]} />
          <Bar dataKey="ip_blocks"     name="IP Engeli"      fill="#fb923c" radius={[3,3,0,0]} />
          <Bar dataKey="appointments_found" name="Randevu"   fill="#a78bfa" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
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

// ─── Ana bileşen ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [engine,     setEngine]     = useState<EngineStatus | null>(null)
  const [botStatus,  setBotStatus]  = useState<BotStatus>({ running:0, paused:0, idle:0, error:0, total:0 })
  const [metrics,    setMetrics]    = useState<BotMetrics>({ login_success:0, login_fail:0, slot_checks:0, ip_blocks:0, captcha_events:0, appointments_found:0 })
  const [dailyData,  setDailyData]  = useState<DailyMetric[]>([])
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])
  const [recentAppts,setRecentAppts]= useState<RecentAppointment[]>([])
  const [totalAccounts, setTotalAccounts] = useState(0)
  const [unreadNotifs,  setUnreadNotifs]  = useState(0)
  const [loading,    setLoading]    = useState(true)

  const fetchAll = useCallback(async () => {
    const supabase = createClient()
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const [
      { data: engineData },
      { data: botsData },
      { count: accCount },
      { count: notifCount },
      { data: logs },
      { data: appts },
      { data: dailyRaw },
    ] = await Promise.all([
      supabase.from('engine_status').select('status, last_heartbeat, started_at, version, worker_count').eq('id', 'bot-engine').maybeSingle(),
      supabase.from('bots').select('status, login_success, login_fail, slot_checks, ip_blocks, captcha_events, appointments_found'),
      supabase.from('visa_accounts').select('*', { count: 'exact', head: true }),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
      supabase.from('bot_logs').select('id, level, message, created_at, bots(name)').order('created_at', { ascending: false }).limit(8),
      supabase.from('appointments').select('id, country, city, visa_type, appointment_date, appointment_time, status, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('bot_daily_metrics').select('date, login_success, login_fail, slot_checks, ip_blocks, appointments_found').gte('date', sevenDaysAgoStr),
    ])

    setEngine((engineData as EngineStatus | null) ?? null)

    const bots = botsData ?? []
    setBotStatus({
      running: bots.filter(b => b.status === 'running').length,
      paused:  bots.filter(b => b.status === 'paused').length,
      idle:    bots.filter(b => b.status === 'idle').length,
      error:   bots.filter(b => b.status === 'error').length,
      total:   bots.length,
    })

    // Bütün botların metriklerini topla
    const sumField = (field: keyof typeof metrics) =>
      bots.reduce((s, b) => s + ((b as Record<string, number>)[field as string] ?? 0), 0)

    setMetrics({
      login_success:     sumField('login_success'),
      login_fail:        sumField('login_fail'),
      slot_checks:       sumField('slot_checks'),
      ip_blocks:         sumField('ip_blocks'),
      captcha_events:    sumField('captcha_events'),
      appointments_found: sumField('appointments_found'),
    })

    // Günlük grafik verisi — tarih bazında topla
    const dayMap = new Map<string, DailyMetric>()
    for (const row of (dailyRaw ?? [])) {
      const existing = dayMap.get(row.date)
      if (existing) {
        existing.login_success     += row.login_success ?? 0
        existing.login_fail        += row.login_fail ?? 0
        existing.slot_checks       += row.slot_checks ?? 0
        existing.ip_blocks         += row.ip_blocks ?? 0
        existing.appointments_found += row.appointments_found ?? 0
      } else {
        dayMap.set(row.date, { ...row })
      }
    }
    setDailyData(mergeDailyMetrics(Array.from(dayMap.values())))

    setTotalAccounts(accCount ?? 0)
    setUnreadNotifs(notifCount ?? 0)
    setRecentLogs((logs ?? []) as unknown as RecentLog[])
    setRecentAppts((appts ?? []) as unknown as RecentAppointment[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30_000)
    return () => clearInterval(interval)
  }, [fetchAll])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" />)}
        </div>
      </div>
    )
  }

  if (botStatus.total === 0 && totalAccounts === 0) return <EmptyDashboard />

  const engineOnline = isEngineOnline(engine)

  return (
    <div className="space-y-5">

      {/* ── Engine Status Bar ── */}
      <EngineStatusBar engine={engine} />

      {/* ── Satır 1: Hesap / Bot / Randevu / Bildirim ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}         label="VFS Hesap"          value={totalAccounts}             sub="Toplam kayıtlı"   color="text-blue-600 dark:text-blue-400"         iconBg="bg-blue-100 dark:bg-blue-950" />
        <MetricCard icon={Bot}           label="Aktif Bot"           value={`${botStatus.running}/${botStatus.total}`} sub="Çalışıyor / Toplam" color="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-100 dark:bg-emerald-950" />
        <MetricCard icon={CalendarCheck} label="Bulunan Randevu"    value={metrics.appointments_found} sub="Tüm zamanlar"     color="text-violet-600 dark:text-violet-400"     iconBg="bg-violet-100 dark:bg-violet-950" />
        <MetricCard icon={Bell}          label="Okunmamış Bildirim"  value={unreadNotifs}               sub="Bekleyen"         color="text-amber-600 dark:text-amber-400"       iconBg="bg-amber-100 dark:bg-amber-950" />
      </div>

      {/* ── Satır 2: Metrikler + Bot Durumu ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Başarı metrikleri */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <MetricCard icon={LogIn}       label="Başarılı Login"      value={metrics.login_success}  sub="Toplam"   color="text-emerald-600 dark:text-emerald-400" iconBg="bg-emerald-100 dark:bg-emerald-950" />
          <MetricCard icon={CheckCircle2}label="Slot Kontrolü"       value={metrics.slot_checks}    sub="Başarılı" color="text-blue-600 dark:text-blue-400"       iconBg="bg-blue-100 dark:bg-blue-950" />
          <MetricCard icon={CalendarCheck} label="Randevu Bulundu"   value={metrics.appointments_found} sub="Toplam" color="text-violet-600 dark:text-violet-400" iconBg="bg-violet-100 dark:bg-violet-950" />
          <MetricCard icon={XCircle}     label="Başarısız Login"     value={metrics.login_fail}     sub="Toplam"   color="text-red-600 dark:text-red-400"         iconBg="bg-red-100 dark:bg-red-950" />
          <MetricCard icon={ShieldAlert} label="IP Engeli"           value={metrics.ip_blocks}      sub="Toplam"   color="text-orange-600 dark:text-orange-400"   iconBg="bg-orange-100 dark:bg-orange-950" />
          <MetricCard icon={Globe}       label="CAPTCHA"             value={metrics.captcha_events} sub="Toplam"   color="text-slate-600 dark:text-slate-400"     iconBg="bg-slate-100 dark:bg-slate-800" />
        </div>

        {/* Bot durumu */}
        <BotStatusGrid botStatus={botStatus} />
      </div>

      {/* ── Satır 3: Günlük Grafik ── */}
      <DailyChart data={dailyData} />

      {/* ── Satır 4: Son Loglar + Son Randevular ── */}
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
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5', LOG_COLORS[log.level] ?? LOG_COLORS.info)}>
                    {log.level === 'success' ? 'Başarı' : log.level === 'error' ? 'Hata' : log.level === 'warning' ? 'Uyarı' : 'Info'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{log.message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {log.bots?.name ?? 'Sistem'} · {new Date(log.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
                      {appt.country}{appt.city ? ` — ${appt.city}` : ''}
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

      {/* ── Satır 5: Hızlı Erişim ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />Hızlı Erişim
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Hesap Ekle',   href: '/accounts',  color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'           },
            { label: 'Bot Oluştur',  href: '/bots',      color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
            { label: 'Logları Gör',  href: '/logs',      color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'         },
            { label: 'Analitik',     href: '/analytics', color: 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'     },
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
