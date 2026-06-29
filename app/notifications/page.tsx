'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Bell, BellOff, CheckCheck, RefreshCw, Database, Clock } from 'lucide-react'

type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  success:  'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  warning:  'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  error:    'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400',
  info:     'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  appointment: 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400',
}

export default function NotificationsPage() {
  const [notifs,     setNotifs]     = useState<Notification[]>([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState<'all' | 'unread'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifs = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setNotifs((data ?? []) as Notification[])
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifs.filter(n => !n.is_read).length
  const filtered = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam',       value: notifs.length,          color: 'text-slate-700 dark:text-slate-300' },
          { label: 'Okunmamış',    value: unreadCount,            color: 'text-blue-600 dark:text-blue-400'   },
          { label: 'Okundu',       value: notifs.length - unreadCount, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Bildirimler */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bildirimler</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs">
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1 rounded-md font-medium transition-colors',
                  filter === f ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400'
                )}>
                  {f === 'all' ? 'Tümü' : `Okunmamış (${unreadCount})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="secondary" size="sm" onClick={markAllRead}>
                <CheckCheck className="w-3 h-3" />Tümünü Okundu İşaretle
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => fetchNotifs(true)} disabled={refreshing}>
              <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />Yenile
            </Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            {notifs.length === 0 ? (
              <><Database className="w-10 h-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500 dark:text-slate-400">Henüz bildirim yok.</p></>
            ) : (
              <><BellOff className="w-10 h-10 text-slate-300 dark:text-slate-600" /><p className="text-sm text-slate-500 dark:text-slate-400">Tüm bildirimler okundu.</p></>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {filtered.map(notif => (
              <div key={notif.id} className={cn(
                'px-5 py-4 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                !notif.is_read && 'bg-blue-50/30 dark:bg-blue-950/10'
              )}>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  TYPE_COLORS[notif.type] ?? TYPE_COLORS.info
                )}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn('text-sm font-semibold', !notif.is_read ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300')}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.is_read && (
                        <button onClick={() => markRead(notif.id)} className="text-xs text-blue-500 hover:underline whitespace-nowrap">Okundu</button>
                      )}
                      <Badge variant={notif.is_read ? 'default' : 'info'} dot={!notif.is_read}>
                        {notif.is_read ? 'Okundu' : 'Yeni'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{new Date(notif.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
