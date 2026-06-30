'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/helpers/cn'
import { TrendingUp, TrendingDown, CalendarCheck, Bot, RefreshCw, Database } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type Appointment = {
  id: string
  country: string
  status: 'available' | 'booked' | 'expired'
  created_at: string
  bot_id: string
}

type BotLog = {
  id: string
  level: 'info' | 'success' | 'warning' | 'error'
  created_at: string
  bot_id: string
}

type BotRow = {
  id: string
  name: string
  status: string
  visa_accounts: { country: string | null } | null
}

const DAY_LABELS = ['Pzt', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cmt', 'Paz']
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#f97316']

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [logs,         setLogs]         = useState<BotLog[]>([])
  const [bots,         setBots]         = useState<BotRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()
    const [{ data: appts }, { data: logRows }, { data: botRows }] = await Promise.all([
      supabase.from('appointments').select('id, country, status, created_at, bot_id').order('created_at', { ascending: false }).limit(500),
      supabase.from('bot_logs').select('id, level, created_at, bot_id').order('created_at', { ascending: false }).limit(1000),
      supabase.from('bots').select('id, name, status, visa_accounts(country)'),
    ])
    setAppointments((appts ?? []) as unknown as Appointment[])
    setLogs((logRows ?? []) as BotLog[])
    setBots((botRows ?? []) as unknown as BotRow[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Ülkelere göre randevu sayısı
  const byCountry = Object.entries(
    appointments.reduce<Record<string, { found: number; booked: number }>>((acc, a) => {
      if (!acc[a.country]) acc[a.country] = { found: 0, booked: 0 }
      acc[a.country].found++
      if (a.status === 'booked') acc[a.country].booked++
      return acc
    }, {})
  ).sort((a, b) => b[1].found - a[1].found)

  const maxFound = byCountry[0]?.[1].found || 1

  // Son 7 günün verileri
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const dayIdx  = (d.getDay() + 6) % 7
    return {
      day:      DAY_LABELS[dayIdx],
      date:     dateStr,
      isToday:  i === 6,
      found:    appointments.filter(a => a.created_at.startsWith(dateStr)).length,
      attempts: logs.filter(l => l.created_at.startsWith(dateStr)).length,
    }
  })

  const maxFound7  = Math.max(...last7.map(d => d.found),  1)
  const maxAttempt = Math.max(...last7.map(d => d.attempts), 1)

  // KPI
  const totalFound    = appointments.length
  const totalBooked   = appointments.filter(a => a.status === 'booked').length
  const totalLogs     = logs.length
  const successRate   = totalFound > 0 ? Math.round((totalBooked / totalFound) * 100) : 0
  const activeBots    = bots.filter(b => b.status === 'running').length

  // Bot bazlı performans
  const botPerf = bots.map(b => ({
    ...b,
    found:    appointments.filter(a => a.bot_id === b.id).length,
    logCount: logs.filter(l => l.bot_id === b.id).length,
    errors:   logs.filter(l => l.bot_id === b.id && l.level === 'error').length,
  })).sort((a, b) => b.found - a.found)

  const COUNTRY_EMOJI: Record<string, string> = {
    italya: '🇮🇹', hollanda: '🇳🇱', almanya: '🇩🇪', fransa: '🇫🇷', ispanya: '🇪🇸', türkiye: '🇹🇷',
  }
  const getEmoji = (c: string) => COUNTRY_EMOJI[c.toLowerCase()] ?? '🌍'

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      ))}
    </div>
  )

  const kpis = [
    {
      title: 'Bulunan Randevu',
      value: totalFound.toString(),
      sub: 'Tüm zamanlar toplam',
      icon: CalendarCheck,
      color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
      trend: last7[6].found - last7[5].found,
    },
    {
      title: 'Toplam Log',
      value: totalLogs.toLocaleString('tr-TR'),
      sub: 'Tüm botlar',
      icon: Database,
      color: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
      trend: last7[6].attempts - last7[5].attempts,
    },
    {
      title: 'Rezervasyon Oranı',
      value: `%${successRate}`,
      sub: 'Bulunan → Rezerve',
      icon: TrendingUp,
      color: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
      trend: 0,
    },
    {
      title: 'Aktif Bot',
      value: `${activeBots}/${bots.length}`,
      sub: 'Şu an çalışan',
      icon: Bot,
      color: 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400',
      trend: 0,
    },
  ]

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.title} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.title}</p>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.color)}>
                <kpi.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{kpi.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{kpi.sub}</p>
            {kpi.trend !== 0 && (
              <p className={cn('text-xs font-semibold mt-2 flex items-center gap-1',
                kpi.trend > 0 ? 'text-emerald-600' : 'text-red-500')}>
                {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                Dünden {kpi.trend > 0 ? `+${kpi.trend}` : kpi.trend}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Grafik satırı */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Ülkelere göre randevu */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Ülkelere Göre Randevu</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Toplam bulunan randevu sayısı</p>

          {byCountry.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-300 dark:text-slate-600 gap-2">
              <CalendarCheck className="w-8 h-8" />
              <p className="text-xs">Henüz randevu yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {byCountry.slice(0, 6).map(([country, data], i) => {
                const barW = Math.round((data.found / maxFound) * 100)
                return (
                  <div key={country}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {getEmoji(country)} {country}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{data.found}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full transition-all"
                        style={{ width: `${barW}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 7 günlük trend */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">7 Günlük Trend</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />Log</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" />Randevu</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Günlük log ve randevu sayısı</p>

          <div className="flex items-end gap-3 h-36">
            {last7.map(d => {
              const attH  = Math.round((d.attempts / maxAttempt) * 100)
              const findH = Math.round((d.found    / maxFound7)  * 100)
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  {d.found > 0 && <span className="text-xs font-semibold text-emerald-600">{d.found}</span>}
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '85%' }}>
                    <div
                      className={cn('flex-1 rounded-t transition-all', d.isToday ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900')}
                      style={{ height: `${Math.max(attH, 2)}%` }}
                    />
                    <div
                      className={cn('flex-1 rounded-t transition-all', d.isToday ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-900')}
                      style={{ height: `${Math.max(findH, d.found > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', d.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')}>
                    {d.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bot performans tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bot Bazlı Performans</h3>
            <p className="text-xs text-slate-400 mt-0.5">Randevu ve log bazlı bot verimliliği</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
            Yenile
          </Button>
        </div>

        {botPerf.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Bot className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Henüz bot oluşturulmamış.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Bot', 'Ülke', 'Durum', 'Bulunan Randevu', 'Toplam Log', 'Hata Sayısı', 'Hata Oranı'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {botPerf.map(bot => {
                  const errRate = bot.logCount > 0 ? Math.round((bot.errors / bot.logCount) * 100) : 0
                  const statusVariant = bot.status === 'running' ? 'success' : bot.status === 'error' ? 'error' : 'default'
                  const statusLabel   = bot.status === 'running' ? 'Çalışıyor' : bot.status === 'error' ? 'Hata' : bot.status === 'paused' ? 'Durduruldu' : 'Bekliyor'
                  return (
                    <tr key={bot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {getEmoji(bot.visa_accounts?.country ?? '')} {bot.name}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                        {bot.visa_accounts?.country ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                          statusVariant === 'success' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          statusVariant === 'error'   ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        )}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">{bot.found}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{bot.logCount.toLocaleString('tr-TR')}</td>
                      <td className="py-3 px-4">
                        <span className={cn('font-semibold text-xs',
                          bot.errors === 0 ? 'text-emerald-600' : bot.errors < 5 ? 'text-amber-600' : 'text-red-600')}>
                          {bot.errors}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={cn('h-1.5 rounded-full',
                                errRate === 0 ? 'bg-emerald-500' : errRate < 10 ? 'bg-amber-500' : 'bg-red-500')}
                              style={{ width: `${errRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">%{errRate}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
