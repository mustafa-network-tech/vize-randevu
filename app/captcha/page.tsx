'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Fingerprint, Clock, CheckCircle, XCircle, Timer, RefreshCw, AlertTriangle } from 'lucide-react'

type CaptchaLog = {
  id: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  created_at: string
  bot_id: string
  bots: { name: string } | null
}

type BotLog = {
  id: string
  level: string
  created_at: string
  bot_id: string
}

function parseCaptchaStatus(log: CaptchaLog): 'solved' | 'failed' | 'pending' {
  const msg = log.message.toLowerCase()
  if (log.level === 'success' || msg.includes('çözüldü') || msg.includes('solved')) return 'solved'
  if (log.level === 'error' || msg.includes('başarısız') || msg.includes('failed')) return 'failed'
  return 'pending'
}

export default function CaptchaPage() {
  const [captchaLogs, setCaptchaLogs] = useState<CaptchaLog[]>([])
  const [allLogs,     setAllLogs]     = useState<BotLog[]>([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()

    const [{ data: capLogs }, { data: allLogRows }] = await Promise.all([
      supabase
        .from('bot_logs')
        .select('id, message, level, created_at, bot_id, bots(name)')
        .ilike('message', '%captcha%')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('bot_logs')
        .select('id, level, created_at, bot_id')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    setCaptchaLogs((capLogs ?? []) as unknown as CaptchaLog[])
    setAllLogs((allLogRows ?? []) as BotLog[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Saatlik dağılım (son 6 saat)
  const HOURS = Array.from({ length: 6 }, (_, i) => {
    const h = new Date()
    h.setHours(h.getHours() - (5 - i), 0, 0, 0)
    return h.getHours()
  })
  const currentHour = new Date().getHours()

  const hourlyData = HOURS.map(h => ({
    hour: h,
    captcha: captchaLogs.filter(l => new Date(l.created_at).getHours() === h).length,
    total:   allLogs.filter(l => new Date(l.created_at).getHours() === h).length,
  }))
  const hourlyMax = Math.max(...hourlyData.map(d => d.total), 1)

  const counts = {
    solved:  captchaLogs.filter(l => parseCaptchaStatus(l) === 'solved').length,
    failed:  captchaLogs.filter(l => parseCaptchaStatus(l) === 'failed').length,
    pending: captchaLogs.filter(l => parseCaptchaStatus(l) === 'pending').length,
  }
  const total = counts.solved + counts.failed
  const successRate = total > 0 ? Math.round((counts.solved / total) * 100) : 0

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* CAPTCHA entegrasyon bilgi banner */}
      {captchaLogs.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">CAPTCHA olayı kaydedilmedi</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Bot motoru henüz CAPTCHA ile karşılaşmadı. VFS portalında CAPTCHA çıktığında bu sayfa otomatik dolacaktır.
              CAPTCHA log kaydı için bot_logs mesajında "captcha" ifadesi geçmesi gerekir.
            </p>
          </div>
        </div>
      )}

      {/* KPI kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Bekleyen CAPTCHA',
            value: counts.pending,
            icon: Fingerprint,
            color: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
            note: counts.pending > 0 ? 'Manuel müdahale gerekebilir' : 'Tüm kuyruk temiz',
          },
          {
            label: 'Çözülen CAPTCHA',
            value: counts.solved,
            icon: CheckCircle,
            color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
            note: `${total} işlemden`,
          },
          {
            label: 'Başarısız CAPTCHA',
            value: counts.failed,
            icon: XCircle,
            color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
            note: total > 0 ? `%${100 - successRate} başarısızlık oranı` : 'Kayıt yok',
          },
          {
            label: 'Toplam Log Kaydı',
            value: allLogs.length,
            icon: Timer,
            color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
            note: 'Tüm bot logları',
          },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">{item.label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{item.note}</p>
          </div>
        ))}
      </div>

      {/* Başarı oranı + Saatlik dağılım */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Başarı donut */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 self-start">Başarı Oranı</h3>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3"
                className="dark:[stroke:#1e293b]" />
              {total > 0 && (
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${successRate} ${100 - successRate}`}
                  strokeLinecap="round" />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {total > 0 ? `%${successRate}` : '—'}
              </span>
              <span className="text-xs text-slate-400">başarı</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 w-full">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{counts.solved}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Çözüldü</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-500">{counts.failed}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Başarısız</p>
            </div>
          </div>
        </div>

        {/* Saatlik bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Saatlik Bot Aktivitesi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Son 6 saat — CAPTCHA ve genel log sayısı</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />Toplam Log</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-400 rounded-sm inline-block" />CAPTCHA</span>
            </div>
          </div>
          <div className="flex items-end gap-4 h-32">
            {hourlyData.map(h => {
              const totalH   = Math.round((h.total   / hourlyMax) * 100)
              const captchaH = h.total > 0 ? Math.round((h.captcha / hourlyMax) * 100) : 0
              const isNow    = h.hour === currentHour
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{h.total}</span>
                  <div className="w-full flex gap-1 justify-center items-end" style={{ height: '90%' }}>
                    <div
                      className={cn('flex-1 rounded-t transition-all', isNow ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900')}
                      style={{ height: `${Math.max(totalH, h.total > 0 ? 5 : 0)}%` }}
                    />
                    <div
                      className={cn('flex-1 rounded-t transition-all', isNow ? 'bg-amber-400' : 'bg-amber-200 dark:bg-amber-900')}
                      style={{ height: `${Math.max(captchaH, h.captcha > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', isNow ? 'text-blue-600' : 'text-slate-400')}>
                    {h.hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Son CAPTCHA logları */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">CAPTCHA Log Kayıtları</h3>
            {captchaLogs.length > 0 && (
              <Badge variant="info">{captchaLogs.length} kayıt</Badge>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />Yenile
          </Button>
        </div>

        {captchaLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Fingerprint className="w-12 h-12 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Henüz CAPTCHA log kaydı bulunmuyor.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-sm">
              Bot motoru VFS portalında CAPTCHA ile karşılaştığında loglar buraya yansıyacaktır.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Bot', 'Mesaj', 'Saat', 'Durum'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {captchaLogs.map(log => {
                  const st = parseCaptchaStatus(log)
                  return (
                    <tr key={log.id} className={cn(
                      'transition-colors',
                      st === 'failed'  ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40' :
                      st === 'pending' ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40' :
                      'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}>
                      <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {(log.bots as { name: string } | null)?.name ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.created_at).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={st === 'solved' ? 'success' : st === 'failed' ? 'error' : 'warning'}
                          dot
                        >
                          {st === 'solved' ? 'Çözüldü' : st === 'failed' ? 'Başarısız' : 'Bekliyor'}
                        </Badge>
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
