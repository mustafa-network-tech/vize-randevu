'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import {
  RefreshCw, Users, Bot, CalendarCheck, Activity,
  Circle, Clock, AlertTriangle, CheckCircle2, Info, Zap,
} from 'lucide-react'

type UserRow = {
  id: string
  full_name: string | null
  role: string
  bots: BotRow[]
}

type BotRow = {
  id: string
  name: string
  status: 'idle' | 'running' | 'paused' | 'error'
  check_interval: number
  last_run: string | null
  visa_accounts: { country: string; email: string } | null
  log_count: number
  appt_count: number
}

type LogRow = {
  id: number
  level: string
  message: string
  created_at: string
  bots: { name: string; user_id: string } | null
  user_name?: string
}

type ApptRow = {
  id: string
  country: string
  appointment_date: string
  appointment_time: string | null
  status: string
  created_at: string
  bots: { name: string } | null
}

const STATUS_CFG = {
  idle:    { label: 'Bekliyor',    color: 'text-slate-400',   dot: 'bg-slate-400'                      },
  running: { label: 'Çalışıyor',  color: 'text-emerald-400', dot: 'bg-emerald-400 animate-pulse'       },
  paused:  { label: 'Duraklatıldı', color: 'text-amber-400', dot: 'bg-amber-400'                      },
  error:   { label: 'Hata',       color: 'text-red-400',     dot: 'bg-red-500'                        },
}

const LEVEL_CFG: Record<string, { variant: 'success'|'error'|'warning'|'info'|'default'; icon: typeof Info }> = {
  info:    { variant: 'info',    icon: Info           },
  success: { variant: 'success', icon: CheckCircle2   },
  warning: { variant: 'warning', icon: AlertTriangle  },
  error:   { variant: 'error',   icon: AlertTriangle  },
}

export default function MonitorPage() {
  const [users,      setUsers]      = useState<UserRow[]>([])
  const [logs,       setLogs]       = useState<LogRow[]>([])
  const [appts,      setAppts]      = useState<ApptRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    const supabase = createClient()

    const [
      { data: profiles },
      { data: bots },
      { data: recentLogs },
      { data: recentAppts },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role').order('created_at'),
      supabase.from('bots').select('id, name, status, check_interval, last_run, user_id, visa_accounts(country, email)'),
      supabase.from('bot_logs')
        .select('id, level, message, created_at, bots(name, user_id)')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('appointments')
        .select('id, country, appointment_date, appointment_time, status, created_at, bots(name)')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Bot log ve randevu sayıları
    const { data: logCounts  } = await supabase.from('bot_logs').select('bot_id')
    const { data: apptCounts } = await supabase.from('appointments').select('bot_id')

    const logMap:  Record<string, number> = {}
    const apptMap: Record<string, number> = {}
    ;(logCounts  ?? []).forEach((r: {bot_id: string}) => { logMap[r.bot_id]  = (logMap[r.bot_id]  ?? 0) + 1 })
    ;(apptCounts ?? []).forEach((r: {bot_id: string}) => { apptMap[r.bot_id] = (apptMap[r.bot_id] ?? 0) + 1 })

    // Profillere botları eşleştir
    const profileMap: Record<string, string | null> = {}
    ;(profiles ?? []).forEach((p: {id: string; full_name: string | null}) => { profileMap[p.id] = p.full_name })

    const userRows: UserRow[] = (profiles ?? []).map((p: {id: string; full_name: string | null; role: string}) => ({
      ...p,
      bots: (bots ?? [])
        .filter((b: {user_id: string}) => b.user_id === p.id)
        .map((b: {id: string; name: string; status: 'idle'|'running'|'paused'|'error'; check_interval: number; last_run: string | null; visa_accounts: unknown}) => ({
          ...b,
          visa_accounts: Array.isArray(b.visa_accounts) ? (b.visa_accounts[0] ?? null) : b.visa_accounts,
          log_count:  logMap[b.id]  ?? 0,
          appt_count: apptMap[b.id] ?? 0,
        })),
    }))

    // Loglara kullanıcı adı ekle
    const enrichedLogs: LogRow[] = (recentLogs ?? []).map((l: {id: number; level: string; message: string; created_at: string; bots: {name: string; user_id: string}[] | {name: string; user_id: string} | null}) => {
      const botsObj = Array.isArray(l.bots) ? l.bots[0] ?? null : l.bots
      return {
        ...l,
        bots: botsObj,
        user_name: botsObj?.user_id ? (profileMap[botsObj.user_id] ?? 'Bilinmiyor') : 'Bilinmiyor',
      }
    })

    setUsers(userRows)
    setLogs(enrichedLogs)
    setAppts((recentAppts ?? []) as unknown as ApptRow[])
    setLastUpdate(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Otomatik yenileme — 15 saniyede bir
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => fetchAll(true), 15000)
    return () => clearInterval(timer)
  }, [autoRefresh, fetchAll])

  const totalBots    = users.reduce((s, u) => s + u.bots.length, 0)
  const runningBots  = users.reduce((s, u) => s + u.bots.filter(b => b.status === 'running').length, 0)
  const totalAppts   = appts.length

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" />)}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Üst bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className={cn('w-2 h-2 rounded-full', autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400')} />
            {autoRefresh ? 'Canlı — 15sn' : 'Manuel'}
          </div>
          {lastUpdate && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAutoRefresh(v => !v)}>
            <Circle className={cn('w-3 h-3', autoRefresh && 'fill-emerald-500 text-emerald-500')} />
            {autoRefresh ? 'Canlıyı Durdur' : 'Canlı Yap'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fetchAll()} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />Yenile
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,         label: 'Toplam Kullanıcı', value: users.length,  color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'          },
          { icon: Bot,           label: 'Toplam Bot',        value: totalBots,     color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'       },
          { icon: Zap,           label: 'Çalışan Bot',       value: runningBots,   color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' },
          { icon: CalendarCheck, label: 'Bulunan Randevu',   value: totalAppts,    color: 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'   },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', item.color)}>
              <item.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Kullanıcı kartları */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />Kullanıcı Durumları
        </h2>
        {users.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center text-sm text-slate-400">
            Henüz kullanıcı yok.
          </div>
        ) : (
          <div className="space-y-3">
            {users.map(user => {
              const running = user.bots.filter(b => b.status === 'running').length
              const hasError = user.bots.some(b => b.status === 'error')
              return (
                <div key={user.id} className={cn(
                  'bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-5',
                  hasError ? 'border-red-200 dark:border-red-900' :
                  running > 0 ? 'border-emerald-200 dark:border-emerald-900' :
                  'border-slate-200 dark:border-slate-800'
                )}>
                  {/* Kullanıcı başlık */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold',
                        user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                      )}>
                        {(user.full_name ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{user.full_name ?? 'İsimsiz Kullanıcı'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{user.role === 'admin' ? 'Admin' : 'Kullanıcı'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{user.bots.length} bot</span>
                      {running > 0 && <span className="text-emerald-500 font-semibold">{running} çalışıyor</span>}
                      {hasError  && <span className="text-red-500 font-semibold">hata var</span>}
                    </div>
                  </div>

                  {/* Botlar */}
                  {user.bots.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">Henüz bot oluşturulmamış.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {user.bots.map(bot => {
                        const sc = STATUS_CFG[bot.status] ?? STATUS_CFG.idle
                        return (
                          <div key={bot.id} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex-1">{bot.name}</p>
                              <span className={cn('text-xs font-medium', sc.color)}>{sc.label}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center">
                              <div className="bg-white dark:bg-slate-900 rounded px-1 py-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{bot.visa_accounts?.country ?? '—'}</p>
                                <p className="text-[10px] text-slate-400">Ülke</p>
                              </div>
                              <div className="bg-white dark:bg-slate-900 rounded px-1 py-1">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{bot.log_count}</p>
                                <p className="text-[10px] text-slate-400">Log</p>
                              </div>
                              <div className="bg-white dark:bg-slate-900 rounded px-1 py-1">
                                <p className="text-xs font-bold text-violet-600 dark:text-violet-400">{bot.appt_count}</p>
                                <p className="text-[10px] text-slate-400">Randevu</p>
                              </div>
                            </div>
                            {bot.last_run && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(bot.last_run).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Son aktivite */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Son Aktiviteler</h3>
          </div>
          {logs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Henüz aktivite yok.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {logs.map(log => {
                const lc = LEVEL_CFG[log.level] ?? LEVEL_CFG.info
                return (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <Badge variant={lc.variant} dot>{log.level}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{log.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {log.user_name} · {log.bots?.name ?? '—'} · {new Date(log.created_at).toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Son bulunan randevular */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <CalendarCheck className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Son Bulunan Randevular</h3>
          </div>
          {appts.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Henüz randevu bulunamadı.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {appts.map(appt => (
                <div key={appt.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{appt.country}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{appt.appointment_date} {appt.appointment_time ?? ''} · {appt.bots?.name ?? '—'}</p>
                  </div>
                  <Badge variant={appt.status === 'available' ? 'success' : appt.status === 'booked' ? 'info' : 'default'} dot>
                    {appt.status === 'available' ? 'Müsait' : appt.status === 'booked' ? 'Alındı' : 'Bitti'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
