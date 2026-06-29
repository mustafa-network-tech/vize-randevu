'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { CalendarCheck, Clock, Database, RefreshCw, Filter } from 'lucide-react'

type Appointment = {
  id: string
  bot_id: string
  country: string
  city: string | null
  center: string | null
  visa_type: string | null
  appointment_date: string
  appointment_time: string | null
  status: 'available' | 'booked' | 'expired'
  created_at: string
  bots: { name: string } | null
}

const STATUS_CFG = {
  available: { label: 'Müsait',          variant: 'success'  as const },
  booked:    { label: 'Rezerve Edildi',  variant: 'info'     as const },
  expired:   { label: 'Süresi Doldu',   variant: 'default'  as const },
}

const COUNTRY_EMOJI: Record<string, string> = {
  'italya': '🇮🇹', 'hollanda': '🇳🇱', 'almanya': '🇩🇪', 'fransa': '🇫🇷', 'ispanya': '🇪🇸',
}
const getEmoji = (c: string) => COUNTRY_EMOJI[c.toLowerCase()] ?? '🌍'

export default function AppointmentsPage() {
  const [appts,    setAppts]    = useState<Appointment[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('appointments')
      .select('*, bots(name)')
      .order('appointment_date', { ascending: true })
      .limit(100)
    setAppts((data ?? []) as Appointment[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const setStatus = async (id: string, status: Appointment['status']) => {
    const supabase = createClient()
    await supabase.from('appointments').update({ status }).eq('id', id)
    setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const counts = {
    all:       appts.length,
    available: appts.filter(a => a.status === 'available').length,
    booked:    appts.filter(a => a.status === 'booked').length,
    expired:   appts.filter(a => a.status === 'expired').length,
  }

  const filtered = filter === 'all' ? appts : appts.filter(a => a.status === filter)

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'all',       label: 'Toplam',         color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'          },
          { key: 'available', label: 'Müsait',         color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'    },
          { key: 'booked',    label: 'Rezerve',        color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'               },
          { key: 'expired',   label: 'Süresi Doldu',  color: 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'            },
        ].map(item => (
          <button key={item.key} onClick={() => setFilter(item.key)}
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Randevular ({filtered.length})</h3>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <Filter className="w-3 h-3" />Tümünü Göster
              </button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />Yenile
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {appts.length === 0
                ? 'Henüz randevu bulunamadı. Botları başlatarak tarama başlatabilirsiniz.'
                : 'Bu kategoride randevu yok.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Ülke / Şehir', 'Vize Merkezi', 'Vize Tipi', 'Tarih & Saat', 'Bot', 'Durum', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(appt => {
                  const sc = STATUS_CFG[appt.status]
                  return (
                    <tr key={appt.id} className={cn('transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
                      appt.status === 'available' && 'bg-emerald-50/20 dark:bg-emerald-950/10'
                    )}>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{getEmoji(appt.country)} {appt.country}</p>
                        {appt.city && <p className="text-xs text-slate-400 mt-0.5">{appt.city}</p>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{appt.center ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{appt.visa_type ?? '—'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {appt.appointment_date}
                        </div>
                        {appt.appointment_time && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3" />{appt.appointment_time}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{appt.bots?.name ?? '—'}</td>
                      <td className="py-3 px-4"><Badge variant={sc.variant} dot>{sc.label}</Badge></td>
                      <td className="py-3 px-4">
                        {appt.status === 'available' && (
                          <Button size="sm" onClick={() => setStatus(appt.id, 'booked')}>Rezerve Et</Button>
                        )}
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
