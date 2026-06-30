'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { RefreshCw, Filter, Database, AlertTriangle, CheckCircle2, Info, Clock } from 'lucide-react'

type Log = {
  id: number
  bot_id: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  created_at: string
  bots: { name: string } | null
}

const LEVEL_CFG = {
  info:    { label: 'Info',    variant: 'info'    as const, icon: Info,          bg: '' },
  success: { label: 'Başarı',  variant: 'success' as const, icon: CheckCircle2,  bg: 'bg-emerald-50/30 dark:bg-emerald-950/20' },
  warning: { label: 'Uyarı',   variant: 'warning' as const, icon: AlertTriangle,  bg: 'bg-amber-50/30 dark:bg-amber-950/20' },
  error:   { label: 'Hata',    variant: 'error'   as const, icon: AlertTriangle,  bg: 'bg-red-50/40 dark:bg-red-950/20' },
}

export default function LogsPage() {
  const [logs,       setLogs]       = useState<Log[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('bot_logs')
      .select('id, level, message, created_at, bot_id, bots(name)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) console.error('[logs] fetch error:', error.message)
    setLogs((data ?? []) as unknown as Log[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const counts = {
    all:     logs.length,
    error:   logs.filter(l => l.level === 'error').length,
    warning: logs.filter(l => l.level === 'warning').length,
    success: logs.filter(l => l.level === 'success').length,
    info:    logs.filter(l => l.level === 'info').length,
  }

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'error',   label: 'Hata',    color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'         },
          { key: 'warning', label: 'Uyarı',   color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
          { key: 'success', label: 'Başarı',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
          { key: 'info',    label: 'Bilgi',   color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'     },
        ].map(item => (
          <button key={item.key} onClick={() => setFilter(filter === item.key ? 'all' : item.key)}
            className={cn('bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-4 text-left transition-all',
              filter === item.key ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-800 hover:shadow-md'
            )}>
            <p className={cn('text-2xl font-bold', item.color.split(' ')[0])}>{counts[item.key as keyof typeof counts]}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Log Kayıtları</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">{filtered.length} / {logs.length}</span>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <Filter className="w-3 h-3" />Filtreyi Kaldır
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchLogs(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />Yenile
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {logs.length === 0 ? 'Henüz log kaydı yok. Bir bot başlatın.' : 'Bu seviyede log bulunamadı.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Zaman', 'Seviye', 'Bot', 'Mesaj'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(log => {
                  const lc = LEVEL_CFG[log.level] ?? LEVEL_CFG.info
                  return (
                    <tr key={log.id} className={cn('transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50', lc.bg)}>
                      <td className="py-3 px-4 text-xs font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(log.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={lc.variant} dot>{lc.label}</Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {log.bots?.name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-md truncate">{log.message}</td>
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
