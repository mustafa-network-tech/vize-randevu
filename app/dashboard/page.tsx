import { StatCard } from '@/components/dashboard/StatCard'
import { BotStatusCard, BotData } from '@/components/bots/BotStatusCard'
import { LogTable, LogEntry } from '@/components/logs/LogTable'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Bot, Globe, CalendarCheck, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

const MOCK_STATS = [
  {
    title: 'Aktif Botlar',
    value: '3/5',
    subtitle: '2 bot şu an durduruldu',
    icon: Bot,
    color: 'blue' as const,
    trend: undefined,
  },
  {
    title: 'İzlenen Ülkeler',
    value: '4',
    subtitle: 'İtalya · Hollanda · Almanya · Fransa',
    icon: Globe,
    color: 'violet' as const,
    trend: undefined,
  },
  {
    title: 'Bulunan Randevular',
    value: '9',
    subtitle: 'Son 24 saat',
    icon: CalendarCheck,
    color: 'emerald' as const,
    trend: { value: 12.5, label: 'dünden fazla' },
  },
  {
    title: 'Başarı Oranı',
    value: '%78',
    subtitle: 'Son 7 gün ortalaması',
    icon: TrendingUp,
    color: 'amber' as const,
    trend: { value: 3.2, label: 'geçen haftadan fazla' },
  },
]

const MOCK_BOTS: BotData[] = [
  {
    id: 1,
    name: 'İtalya Bot #1',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    status: 'running',
    lastActivity: '2 dk önce',
    todayAttempts: 145,
    todayFound: 3,
    successRate: 82,
    currentTask: 'Roma - Schengen vizesi kontrol ediliyor',
  },
  {
    id: 2,
    name: 'Hollanda Bot #1',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    status: 'running',
    lastActivity: '5 dk önce',
    todayAttempts: 89,
    todayFound: 1,
    successRate: 74,
    currentTask: 'Amsterdam - Müsait slot aranıyor',
  },
  {
    id: 3,
    name: 'Almanya Bot #1',
    country: 'Almanya',
    countryEmoji: '🇩🇪',
    status: 'error',
    lastActivity: '23 dk önce',
    todayAttempts: 34,
    todayFound: 0,
    successRate: 0,
  },
  {
    id: 4,
    name: 'Fransa Bot #1',
    country: 'Fransa',
    countryEmoji: '🇫🇷',
    status: 'stopped',
    lastActivity: '1 sa önce',
    todayAttempts: 0,
    todayFound: 0,
    successRate: 0,
  },
  {
    id: 5,
    name: 'İtalya Bot #2',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    status: 'running',
    lastActivity: '1 dk önce',
    todayAttempts: 201,
    todayFound: 5,
    successRate: 87,
    currentTask: 'Milano - 15 Ağustos kontrol ediliyor',
  },
]

const MOCK_APPOINTMENTS = [
  { id: 1, applicant: 'Seda Özer', country: '🇮🇹 İtalya', date: '18 Temmuz 2026', type: 'Schengen', status: 'found' as const },
  { id: 2, applicant: 'Akif Can', country: '🇮🇹 İtalya', date: '22 Temmuz 2026', type: 'Schengen', status: 'booked' as const },
  { id: 3, applicant: 'Selma İdiz', country: '🇳🇱 Hollanda', date: '25 Temmuz 2026', type: 'Schengen', status: 'found' as const },
  { id: 4, applicant: 'Yeliz Özsoy', country: '🇮🇹 İtalya', date: '01 Ağustos 2026', type: 'Schengen', status: 'booked' as const },
]

const MOCK_LOGS: LogEntry[] = [
  { id: 1, timestamp: '22:43:12', level: 'success', bot: 'İtalya Bot #2', country: 'İtalya', message: 'Milano ofisinde 15 Ağustos 10:30 slotu bulundu' },
  { id: 2, timestamp: '22:41:05', level: 'info', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Oturum yenilendi, tarama devam ediyor' },
  { id: 3, timestamp: '22:38:47', level: 'error', bot: 'Almanya Bot #1', country: 'Almanya', message: 'Bağlantı zaman aşımı: VFS Germany sunucusu yanıt vermiyor' },
  { id: 4, timestamp: '22:35:20', level: 'success', bot: 'İtalya Bot #1', country: 'İtalya', message: 'Roma ofisinde 18 Temmuz randevusu alındı' },
  { id: 5, timestamp: '22:30:11', level: 'warning', bot: 'İtalya Bot #1', country: 'İtalya', message: 'Rate limit yaklaşıyor, 60 saniye bekleniyor' },
]

const appointmentStatusMap = {
  found: { label: 'Bulundu', variant: 'info' as const },
  booked: { label: 'Rezerve', variant: 'success' as const },
}

export default function DashboardPage() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Üst bilgi bandı */}
      <div className="bg-gradient-to-r from-[#0B1426] to-[#1a2942] rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold text-lg">Hoş geldiniz, Admin</h2>
          <p className="text-slate-400 text-sm mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {dateStr} · {timeStr}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-slate-400 text-xs">Sistem Durumu</p>
            <div className="flex items-center gap-1.5 mt-0.5 justify-end">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-semibold">Tüm sistemler çalışıyor</span>
            </div>
          </div>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Bot durumu + Son randevular */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Botlar */}
        <div className="xl:col-span-2">
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Bot Durumu</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gerçek zamanlı izleme</p>
              </div>
              <Link
                href="/bots"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Tümünü Gör <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_BOTS.map((bot) => (
                <BotStatusCard key={bot.id} bot={bot} />
              ))}
            </div>
          </Card>
        </div>

        {/* Son bulunan randevular */}
        <div>
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Son Randevular</h3>
                <p className="text-xs text-slate-400 mt-0.5">Bugün bulunan/alınan</p>
              </div>
              <Link
                href="/appointments"
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Tümü <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {MOCK_APPOINTMENTS.map((appt) => {
                const statusInfo = appointmentStatusMap[appt.status]
                return (
                  <div key={appt.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{appt.applicant}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{appt.country} · {appt.type}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.date}</p>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Son loglar */}
      <Card padding="none">
        <CardHeader className="px-5 py-4 border-b border-slate-100 mb-0">
          <CardTitle>Son Sistem Logları</CardTitle>
          <Link
            href="/logs"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <LogTable logs={MOCK_LOGS} compact={false} />
      </Card>
    </div>
  )
}
