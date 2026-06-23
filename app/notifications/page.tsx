'use client'

import { useState } from 'react'
import { cn } from '@/lib/helpers/cn'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Bell, CheckCircle2, Settings, Send, TestTube } from 'lucide-react'

/* ── Veri yapıları ────────────────────────────────────────── */

interface Channel {
  id: string
  name: string
  icon: string
  color: string
  enabled: boolean
  configured: boolean
  configLabel: string
  configValue: string
  lastSent: string | null
  sentCount: number
}

interface NotifType {
  id: string
  label: string
  description: string
  icon: string
  severity: 'success' | 'warning' | 'error' | 'info'
}

const CHANNELS_INIT: Channel[] = [
  { id: 'telegram',  name: 'Telegram',  icon: '✈️', color: 'bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800',        enabled: true,  configured: true,  configLabel: 'Bot Token',   configValue: '7312••••••••:AAH••••••••••••••',  lastSent: '5 dk önce',   sentCount: 247 },
  { id: 'whatsapp',  name: 'WhatsApp',  icon: '💬', color: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800', enabled: true,  configured: true,  configLabel: 'Numara',      configValue: '+90 5•• ••• ••••',                lastSent: '22 dk önce',  sentCount: 89  },
  { id: 'email',     name: 'E-posta',   icon: '📧', color: 'bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800',enabled: false, configured: true,  configLabel: 'SMTP Host',   configValue: 'smtp.gmail.com:587',               lastSent: null,          sentCount: 12  },
  { id: 'discord',   name: 'Discord',   icon: '🎮', color: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',enabled: true, configured: true,  configLabel: 'Webhook URL', configValue: 'https://discord.com/api/webhooks/••••',lastSent: '1 sa önce',sentCount: 134 },
]

const NOTIF_TYPES: NotifType[] = [
  { id: 'slot_found',     label: 'Slot Bulundu',       description: 'Müsait randevu slotu tespit edildiğinde',  icon: '📅', severity: 'success' },
  { id: 'captcha',        label: 'CAPTCHA Oluştu',      description: 'Bot bir CAPTCHA ile karşılaştığında',       icon: '🔐', severity: 'warning' },
  { id: 'bot_stopped',    label: 'Bot Durdu',           description: 'Bir bot hata veya durdurma ile kapandığında',icon: '🛑', severity: 'error'   },
  { id: 'proxy_changed',  label: 'Proxy Değişti',       description: 'Otomatik proxy rotasyonu gerçekleştiğinde', icon: '🔄', severity: 'info'    },
  { id: 'account_locked', label: 'Hesap Kilitlendi',    description: 'VFS hesabı kilitlendiğinde',               icon: '🔒', severity: 'error'   },
  { id: 'appointment_booked', label: 'Randevu Alındı',  description: 'Randevu başarıyla rezerve edildiğinde',    icon: '✅', severity: 'success' },
]

/* ── Toggle bileşeni ──────────────────────────────────────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  )
}

/* ── Sayfa ─────────────────────────────────────────────────── */

export default function NotificationsPage() {
  const [channels, setChannels] = useState(CHANNELS_INIT)
  const [channelNotifs, setChannelNotifs] = useState<Record<string, Record<string, boolean>>>(() => {
    const init: Record<string, Record<string, boolean>> = {}
    CHANNELS_INIT.forEach(ch => {
      init[ch.id] = {
        slot_found: true, captcha: true, bot_stopped: true,
        proxy_changed: false, account_locked: true, appointment_booked: true,
      }
    })
    return init
  })

  const toggleChannel = (id: string) =>
    setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))

  const toggleNotif = (chId: string, nId: string) =>
    setChannelNotifs(prev => ({
      ...prev,
      [chId]: { ...prev[chId], [nId]: !prev[chId][nId] },
    }))

  const enabledChannels = channels.filter(c => c.enabled).length
  const totalSent = channels.reduce((s, c) => s + c.sentCount, 0)

  return (
    <div className="space-y-6">

      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Aktif Kanal',      value: enabledChannels,     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950'         },
          { label: 'Toplam Gönderilen',value: totalSent,           color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Bildirim Türü',    value: NOTIF_TYPES.length,  color: 'text-violet-600 bg-violet-50 dark:bg-violet-950'    },
          { label: 'Bugün Gönderilen', value: 34,                  color: 'text-amber-600 bg-amber-50 dark:bg-amber-950'       },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <p className={cn('text-2xl font-bold', item.color.split(' ')[0])}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Kanal kartları */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Bildirim Kanalları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(ch => (
            <div key={ch.id} className={cn(
              'bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-5 transition-all',
              ch.color,
              !ch.enabled && 'opacity-60'
            )}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    {ch.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{ch.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ch.lastSent ? `Son gönderim: ${ch.lastSent}` : 'Henüz gönderilmedi'}
                    </p>
                  </div>
                </div>
                <Toggle checked={ch.enabled} onChange={() => toggleChannel(ch.id)} />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{ch.configLabel}</p>
                  <p className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{ch.configValue}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Send className="w-3 h-3" />
                  {ch.sentCount}
                </div>
              </div>

              {/* Aktif bildirim türleri */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {NOTIF_TYPES.filter(n => channelNotifs[ch.id]?.[n.id]).map(n => (
                  <span key={n.id} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                    {n.icon} {n.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" className="flex-1">
                  <TestTube className="w-3 h-3" />Test Gönder
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-3 h-3" />Yapılandır
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bildirim türleri x kanal matrisi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bildirim Matrisi</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Her kanal için hangi olayların bildirim göndereceğini yapılandır</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-5 min-w-[220px]">Bildirim Türü</th>
                {channels.map(ch => (
                  <th key={ch.id} className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">
                    {ch.icon} {ch.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {NOTIF_TYPES.map(notif => (
                <tr key={notif.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-start gap-2.5">
                      <span className="text-base">{notif.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{notif.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{notif.description}</p>
                      </div>
                    </div>
                  </td>
                  {channels.map(ch => (
                    <td key={ch.id} className="py-3.5 px-4 text-center">
                      <Toggle
                        checked={channelNotifs[ch.id]?.[notif.id] ?? false}
                        onChange={() => toggleNotif(ch.id, notif.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">Değişiklikler otomatik kaydedilir</p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">Kaydedildi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
