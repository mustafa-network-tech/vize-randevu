'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Play, Square, RefreshCw, Clock, Timer, CalendarDays, Bot } from 'lucide-react'

type BotRow = {
  id: string
  name: string
  status: 'idle' | 'running' | 'paused' | 'error'
  check_interval: number
  auto_book: boolean
  last_run: string | null
  created_at: string
  visa_accounts: {
    country: string | null
    city: string | null
    provider: string | null
    email: string | null
  } | null
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

const statusCfg = {
  running: { label: 'Çalışıyor', dot: 'bg-emerald-400 animate-pulse', barColor: 'bg-blue-500',           variant: 'success'  as const },
  idle:    { label: 'Bekliyor',  dot: 'bg-amber-400',                  barColor: 'bg-amber-200 dark:bg-amber-800', variant: 'warning'  as const },
  paused:  { label: 'Durduruldu',dot: 'bg-slate-400',                  barColor: 'bg-slate-200 dark:bg-slate-700', variant: 'default'  as const },
  error:   { label: 'Hata',      dot: 'bg-red-500',                    barColor: 'bg-red-300 dark:bg-red-800',     variant: 'error'    as const },
}

const COUNTRY_EMOJI: Record<string, string> = {
  italya: '🇮🇹', hollanda: '🇳🇱', almanya: '🇩🇪', fransa: '🇫🇷', ispanya: '🇪🇸', türkiye: '🇹🇷',
}
const getEmoji = (c?: string | null) => COUNTRY_EMOJI[(c ?? '').toLowerCase()] ?? '🌍'

function getActiveWindow(bot: BotRow): { start: number; end: number } {
  if (!bot.last_run) return { start: 6, end: 22 }
  const h = new Date(bot.last_run).getHours()
  return { start: Math.max(6, h - 4), end: Math.min(23, h + 8) }
}

export default function SchedulerPage() {
  const [bots,      setBots]      = useState<BotRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [refreshing,setRefreshing]= useState(false)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('bots')
      .select('id, name, status, check_interval, auto_book, last_run, created_at, visa_accounts(country, city, provider, email)')
      .order('created_at', { ascending: true })
    setBots((data ?? []) as unknown as BotRow[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const setAllStatus = async (status: 'running' | 'paused') => {
    const supabase = createClient()
    await supabase.from('bots').update({ status }).neq('id', '00000000-0000-0000-0000-000000000000')
    setBots(prev => prev.map(b => ({ ...b, status })))
  }

  const toggleBot = async (bot: BotRow) => {
    const newStatus = bot.status === 'running' ? 'paused' : 'running'
    const supabase = createClient()
    await supabase.from('bots').update({ status: newStatus }).eq('id', bot.id)
    setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: newStatus } : b))
  }

  const running = bots.filter(b => b.status === 'running').length
  const currentHour = new Date().getHours()

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      ))}
    </div>
  )

  if (bots.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Bot className="w-12 h-12 text-slate-200 dark:text-slate-700" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Henüz bot oluşturulmamış.</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Sol menüden <strong>Botlar</strong> sayfasına gidip bot oluşturabilirsiniz.</p>
    </div>
  )

  const avgInterval = Math.round(bots.reduce((s, b) => s + b.check_interval, 0) / bots.length)
  const countries = new Set(bots.map(b => b.visa_accounts?.country).filter(Boolean)).size

  return (
    <div className="space-y-6">

      {/* Üst bilgi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{running}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">bot aktif şu an</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">mevcut saat</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setAllStatus('paused')}>
            <Square className="w-3 h-3" />Tümünü Durdur
          </Button>
          <Button size="sm" onClick={() => setAllStatus('running')}>
            <Play className="w-3 h-3" />Tümünü Başlat
          </Button>
        </div>
      </div>

      {/* Saat takvimi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Günlük Çalışma Takvimi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Son çalışma saatine göre tahmini pencere</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-500 rounded inline-block" />Aktif</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-300 rounded inline-block dark:bg-amber-700" />Bekliyor</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="sticky left-0 bg-white dark:bg-slate-900 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 min-w-[180px] z-10">
                  Bot
                </th>
                {HOURS.map(h => (
                  <th key={h} className={cn(
                    'text-center text-xs font-semibold py-3 px-1 min-w-[34px] whitespace-nowrap',
                    h === currentHour ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {h.toString().padStart(2, '0')}
                    {h === currentHour && <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {bots.map(bot => {
                const sc = statusCfg[bot.status] ?? statusCfg.idle
                const win = getActiveWindow(bot)
                return (
                  <tr key={bot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="sticky left-0 bg-white dark:bg-slate-900 py-2.5 px-4 z-10">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {getEmoji(bot.visa_accounts?.country)} {bot.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {bot.visa_accounts?.country ?? '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    {HOURS.map(h => {
                      const isActive = h >= win.start && h < win.end
                      const isCurrent = h === currentHour && isActive && bot.status === 'running'
                      return (
                        <td key={h} className="py-2 px-0.5 text-center">
                          <div className={cn(
                            'h-6 rounded transition-all',
                            isActive ? sc.barColor : 'bg-transparent',
                            isCurrent ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                          )} />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bot konfigürasyon tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bot Zamanlama Konfigürasyonu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Her bot için çalışma parametreleri</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Bot', 'Durum', 'Ülke / Hesap', 'Tarama Aralığı', 'Oto Rezervasyon', 'Son Çalışma', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {bots.map(bot => {
                const sc = statusCfg[bot.status] ?? statusCfg.idle
                return (
                  <tr key={bot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {getEmoji(bot.visa_accounts?.country)} {bot.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={sc.variant} dot>{sc.label}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs text-slate-700 dark:text-slate-300">{bot.visa_accounts?.country ?? '—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[160px]">
                        {bot.visa_accounts?.email ?? '—'}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Timer className="w-3 h-3 text-slate-400" />
                        {bot.check_interval}s
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={bot.auto_book ? 'success' : 'default'}>
                        {bot.auto_book ? '✓ Aktif' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {bot.last_run
                        ? new Date(bot.last_run).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
                        : 'Hiç çalışmadı'}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant={bot.status === 'running' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => toggleBot(bot)}
                      >
                        {bot.status === 'running'
                          ? <><Square className="w-3 h-3" />Durdur</>
                          : <><Play className="w-3 h-3" />Başlat</>
                        }
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          Genel Özet
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Bot',          value: bots.length.toString(),                                                   color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'         },
            { label: 'Aktif Bot',           value: `${running}/${bots.length}`,                                              color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
            { label: 'Ort. Tarama Aralığı', value: `${avgInterval}s`,                                                       color: 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300'    },
            { label: 'Kapsanan Ülke',       value: `${countries} ülke`,                                                     color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'        },
          ].map(item => (
            <div key={item.label} className={cn('rounded-xl p-4', item.color)}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs mt-1 opacity-70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
