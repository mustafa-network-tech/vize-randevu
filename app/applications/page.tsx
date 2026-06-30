'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { RefreshCw, Users, CheckCircle, Clock, XCircle, CalendarCheck } from 'lucide-react'

type Applicant = {
  id: string
  full_name: string
  passport_no: string | null
  nationality: string | null
  visa_type: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  user_id: string
}

type Appointment = {
  bot_id: string
  country: string
  appointment_date: string
  appointment_time: string | null
  status: 'available' | 'booked' | 'expired'
}

type BotRow = {
  id: string
  user_id: string
  visa_accounts: { country: string } | null
}

type AppStatus = 'processing' | 'appointment_found' | 'completed' | 'inactive'

const statusConfig: Record<AppStatus, { label: string; variant: BadgeVariant }> = {
  processing:        { label: 'İşleniyor',       variant: 'info'    },
  appointment_found: { label: 'Randevu Bulundu', variant: 'success' },
  completed:         { label: 'Tamamlandı',      variant: 'success' },
  inactive:          { label: 'Pasif',           variant: 'default' },
}

const COUNTRY_EMOJI: Record<string, string> = {
  italya: '🇮🇹', hollanda: '🇳🇱', almanya: '🇩🇪', fransa: '🇫🇷', ispanya: '🇪🇸',
  turkey: '🇹🇷', türkiye: '🇹🇷',
}
const getEmoji = (c?: string | null) => COUNTRY_EMOJI[(c ?? '').toLowerCase()] ?? '🌍'

function deriveStatus(applicant: Applicant, appointments: Appointment[]): AppStatus {
  if (!applicant.is_active) return 'inactive'
  const booked = appointments.find(a => a.status === 'booked')
  if (booked) return 'completed'
  const available = appointments.find(a => a.status === 'available')
  if (available) return 'appointment_found'
  return 'processing'
}

export default function ApplicationsPage() {
  const [applicants,    setApplicants]    = useState<Applicant[]>([])
  const [appointments,  setAppointments]  = useState<Appointment[]>([])
  const [bots,          setBots]          = useState<BotRow[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refreshing,    setRefreshing]    = useState(false)
  const [filter,        setFilter]        = useState<string>('all')

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()

    const [{ data: apps }, { data: appts }, { data: botRows }] = await Promise.all([
      supabase.from('applicants').select('*').order('created_at', { ascending: false }),
      supabase.from('appointments').select('bot_id, country, appointment_date, appointment_time, status'),
      supabase.from('bots').select('id, user_id, visa_accounts(country)'),
    ])

    setApplicants((apps ?? []) as Applicant[])
    setAppointments((appts ?? []) as unknown as Appointment[])
    setBots((botRows ?? []) as unknown as BotRow[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const userBotIds = bots.map(b => b.id)
  const userAppointments = appointments.filter(a => userBotIds.includes(a.bot_id))

  const withStatus = applicants.map(a => ({
    ...a,
    status: deriveStatus(a, userAppointments),
    appointment: userAppointments.find(ap => ap.status === 'booked' || ap.status === 'available'),
    country: bots.find(b => b.user_id === a.user_id)?.visa_accounts?.country ?? null,
  }))

  const filtered = filter === 'all' ? withStatus : withStatus.filter(a => a.status === filter)

  const counts = {
    all:               withStatus.length,
    processing:        withStatus.filter(a => a.status === 'processing').length,
    appointment_found: withStatus.filter(a => a.status === 'appointment_found').length,
    completed:         withStatus.filter(a => a.status === 'completed').length,
    inactive:          withStatus.filter(a => a.status === 'inactive').length,
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'all',               label: 'Toplam',         icon: Users,         color: 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
          { key: 'processing',        label: 'İşleniyor',      icon: Clock,         color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'    },
          { key: 'appointment_found', label: 'Randevu Bulundu',icon: CalendarCheck, color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
          { key: 'completed',         label: 'Tamamlandı',     icon: CheckCircle,   color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200' },
          { key: 'inactive',          label: 'Pasif',          icon: XCircle,       color: 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={cn(
              'rounded-xl p-4 text-left border transition-all',
              item.color,
              filter === item.key
                ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900'
                : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
            )}
          >
            <p className="text-2xl font-bold">{counts[item.key as keyof typeof counts]}</p>
            <p className="text-xs mt-1 font-medium opacity-70">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Başvurular ({filtered.length})
          </h3>
          <Button variant="secondary" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
            Yenile
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Users className="w-12 h-12 text-slate-200 dark:text-slate-700" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {applicants.length === 0
                ? 'Henüz başvuran eklenmemiş.'
                : 'Bu kategoride başvuru yok.'}
            </p>
            {applicants.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Sol menüden <strong>Başvuranlar</strong> sayfasına giderek başvuran ekleyebilirsiniz.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Başvuru Sahibi', 'Pasaport No', 'Ülke / Vize', 'Durum', 'Randevu', 'Tarih'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(app => {
                  const sc = statusConfig[app.status]
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{app.full_name}</p>
                        {app.nationality && (
                          <p className="text-xs text-slate-400 mt-0.5">{app.nationality}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {app.passport_no ?? '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {app.country ? (
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {getEmoji(app.country)} {app.country}
                          </p>
                        ) : <span className="text-slate-400">—</span>}
                        {app.visa_type && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{app.visa_type}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={sc.variant} dot>{sc.label}</Badge>
                        {app.notes && (
                          <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{app.notes}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {app.appointment ? (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md">
                            {app.appointment.appointment_date}
                            {app.appointment.appointment_time && ` ${app.appointment.appointment_time}`}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(app.created_at).toLocaleDateString('tr-TR')}
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
