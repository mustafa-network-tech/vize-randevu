import { StatCard } from '@/components/dashboard/StatCard'
import { LogTable, LogEntry } from '@/components/logs/LogTable'
import { Badge } from '@/components/ui/Badge'
import {
  Bot, Globe, CalendarCheck, TrendingUp, ArrowRight,
  Clock, Zap, CheckCircle2, AlertTriangle, Activity,
  MapPin, Timer
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/helpers/cn'

/* ── Mock veriler ─────────────────────────────────────────── */

const MOCK_STATS = [
  {
    title: 'Aktif Botlar',
    value: '3/5',
    subtitle: '2 bot durduruldu',
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

// 7 günlük performans (bar chart için)
const WEEKLY_DATA = [
  { day: 'Pzt', attempts: 892,  found: 4,  maxAttempts: 1247 },
  { day: 'Sal', attempts: 1043, found: 7,  maxAttempts: 1247 },
  { day: 'Çrş', attempts: 876,  found: 5,  maxAttempts: 1247 },
  { day: 'Prş', attempts: 1187, found: 11, maxAttempts: 1247 },
  { day: 'Cum', attempts: 1034, found: 8,  maxAttempts: 1247 },
  { day: 'Cmt', attempts: 998,  found: 6,  maxAttempts: 1247 },
  { day: 'Bug', attempts: 481,  found: 9,  maxAttempts: 1247, today: true },
]
const WEEKLY_MAX_FOUND = 11

// Kompakt bot durumu tablosu
const MOCK_BOTS = [
  {
    id: 1,
    name: 'İtalya Bot #1',
    emoji: '🇮🇹',
    status: 'running' as const,
    task: 'Roma · Schengen vizesi kontrol ediliyor',
    attempts: 145,
    found: 3,
    rate: 82,
    lastSeen: '2 dk',
  },
  {
    id: 2,
    name: 'İtalya Bot #2',
    emoji: '🇮🇹',
    status: 'running' as const,
    task: 'Milano · 15 Ağustos slotları taranıyor',
    attempts: 201,
    found: 5,
    rate: 87,
    lastSeen: '1 dk',
  },
  {
    id: 3,
    name: 'Hollanda Bot #1',
    emoji: '🇳🇱',
    status: 'running' as const,
    task: 'Amsterdam · Müsait slot aranıyor',
    attempts: 89,
    found: 1,
    rate: 74,
    lastSeen: '5 dk',
  },
  {
    id: 4,
    name: 'Almanya Bot #1',
    emoji: '🇩🇪',
    status: 'error' as const,
    task: 'VFS Germany bağlantısı kesildi',
    attempts: 34,
    found: 0,
    rate: 0,
    lastSeen: '23 dk',
  },
  {
    id: 5,
    name: 'Fransa Bot #1',
    emoji: '🇫🇷',
    status: 'stopped' as const,
    task: 'Manuel durduruldu',
    attempts: 0,
    found: 0,
    rate: 0,
    lastSeen: '1 sa',
  },
]

// Son bulunan randevular
const MOCK_APPOINTMENTS = [
  { id: 1, applicant: 'Seda Özer',      country: '🇮🇹', city: 'Roma',      date: '18 Tem 2026', time: '09:30', status: 'booked' as const },
  { id: 2, applicant: 'Akif Can',       country: '🇮🇹', city: 'Milano',    date: '22 Tem 2026', time: '11:00', status: 'booked' as const },
  { id: 3, applicant: 'Selma İdiz',     country: '🇳🇱', city: 'Amsterdam', date: '25 Tem 2026', time: '14:00', status: 'found'  as const },
  { id: 4, applicant: 'Yeliz Özsoy',    country: '🇮🇹', city: 'Milano',    date: '01 Ağu 2026', time: '09:00', status: 'booked' as const },
  { id: 5, applicant: 'Pelin Köşker',   country: '🇮🇹', city: 'Floransa',  date: '10 Tem 2026', time: '10:00', status: 'found'  as const },
  { id: 6, applicant: 'Hüseyin Demir',  country: '🇮🇹', city: 'Roma',      date: '28 Tem 2026', time: '10:30', status: 'found'  as const },
]

// Son loglar
const MOCK_LOGS: LogEntry[] = [
  { id: 1,  timestamp: '22:43:12', level: 'success', bot: 'İtalya Bot #2',  country: 'İtalya',   message: 'Milano — 15 Ağustos 10:30 slotu rezerve edildi (Akif Can)' },
  { id: 2,  timestamp: '22:41:05', level: 'info',    bot: 'Hollanda Bot #1',country: 'Hollanda', message: 'Oturum yenilendi, Amsterdam taraması devam ediyor' },
  { id: 3,  timestamp: '22:38:47', level: 'error',   bot: 'Almanya Bot #1', country: 'Almanya',  message: 'Bağlantı zaman aşımı: VFS Germany 30 saniyedir yanıt vermiyor' },
  { id: 4,  timestamp: '22:35:20', level: 'success', bot: 'İtalya Bot #1',  country: 'İtalya',   message: 'Roma — 18 Temmuz 09:30 randevusu alındı (Seda Özer)' },
  { id: 5,  timestamp: '22:30:11', level: 'warning', bot: 'İtalya Bot #1',  country: 'İtalya',   message: 'Rate limit yaklaşıyor, 60 saniye bekleniyor' },
  { id: 6,  timestamp: '22:25:33', level: 'info',    bot: 'Hollanda Bot #1',country: 'Hollanda', message: 'Proxy rotasyonu tamamlandı, yeni IP: 185.220.101.xx' },
  { id: 7,  timestamp: '22:20:05', level: 'success', bot: 'İtalya Bot #2',  country: 'İtalya',   message: 'Floransa — 10 Temmuz 10:00 slotu bulundu (Pelin Köşker)' },
  { id: 8,  timestamp: '22:15:18', level: 'error',   bot: 'Almanya Bot #1', country: 'Almanya',  message: 'CAPTCHA çözümü başarısız (3. deneme), 90 sn bekleniyor' },
]

// Ülke performans özeti
const COUNTRY_PERF = [
  { emoji: '🇮🇹', name: 'İtalya',   bots: 2, found: 8, rate: 85, trend: +2 },
  { emoji: '🇳🇱', name: 'Hollanda', bots: 1, found: 1, rate: 74, trend: -1 },
  { emoji: '🇩🇪', name: 'Almanya',  bots: 0, found: 0, rate: 0,  trend:  0 },
  { emoji: '🇫🇷', name: 'Fransa',   bots: 0, found: 0, rate: 0,  trend:  0 },
]

const botStatusCfg = {
  running: { dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-600' },
  error:   { dot: 'bg-red-500',                   text: 'text-red-600'     },
  stopped: { dot: 'bg-slate-400',                 text: 'text-slate-500'   },
  idle:    { dot: 'bg-amber-400',                 text: 'text-amber-600'   },
}

/* ── Sayfa ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const now     = new Date()
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR',  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const weeklyFoundMax = Math.max(...WEEKLY_DATA.map(d => d.found))
  const totalWeeklyFound    = WEEKLY_DATA.reduce((s, d) => s + d.found, 0)
  const totalWeeklyAttempts = WEEKLY_DATA.reduce((s, d) => s + d.attempts, 0)

  return (
    <div className="space-y-6">

      {/* ── Hero banner ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1426] via-[#0f1e38] to-[#1a2f50] rounded-2xl p-6 relative overflow-hidden">
        {/* dekoratif daire */}
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Sistem Aktif</span>
            </div>
            <h2 className="text-white font-bold text-xl leading-tight">Vize Randevu Kontrol Merkezi</h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {dateStr} · {timeStr}
            </p>
          </div>

          {/* Sağ özet kutuları */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Bu Hafta Bulunan', value: totalWeeklyFound,    icon: CalendarCheck, color: 'text-emerald-400' },
              { label: 'Toplam Deneme',    value: totalWeeklyAttempts, icon: Activity,       color: 'text-blue-400'   },
              { label: 'Aktif Bot',        value: 3,                    icon: Bot,            color: 'text-violet-400' },
            ].map(item => (
              <div key={item.label} className="bg-white/8 backdrop-blur border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 min-w-[130px]">
                <item.icon className={cn('w-4 h-4 flex-shrink-0', item.color)} />
                <div>
                  <p className="text-white font-bold text-lg leading-none">{item.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stat kartlar ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MOCK_STATS.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* ── 7 günlük grafik + Ülke performansı ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Bar chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">7 Günlük Performans</h3>
              <p className="text-xs text-slate-400 mt-0.5">Deneme sayısı ve bulunan randevu</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-200 rounded-sm inline-block" /> Deneme</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> Bulunan</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-36">
            {WEEKLY_DATA.map(d => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                {/* Çift bar wrapper */}
                <div className="w-full flex flex-col items-center justify-end gap-0.5 h-28 relative">
                  {/* Deneme barı (arka plan) */}
                  <div
                    className={cn(
                      'w-full rounded-t-md transition-all',
                      d.today ? 'bg-blue-300' : 'bg-blue-100'
                    )}
                    style={{ height: `${(d.attempts / 1247) * 100}%` }}
                  />
                  {/* Bulunan sayı etiketi */}
                  {d.found > 0 && (
                    <span
                      className="absolute text-xs font-bold text-emerald-600"
                      style={{ bottom: `${(d.attempts / 1247) * 100}%`, marginBottom: 2 }}
                    >
                      {d.found}
                    </span>
                  )}
                </div>
                <span className={cn('text-xs font-medium', d.today ? 'text-blue-600' : 'text-slate-400')}>
                  {d.day}
                </span>
                {d.today && (
                  <span className="text-xs text-blue-500 font-semibold">●</span>
                )}
              </div>
            ))}
          </div>

          {/* Alt özet */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
            {[
              { label: 'Haftalık Toplam', value: totalWeeklyFound + ' randevu' },
              { label: 'En İyi Gün',      value: 'Perşembe (11)' },
              { label: 'Ort. Günlük',     value: `${(totalWeeklyFound / 7).toFixed(1)} randevu` },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ülke performansı */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Ülke Performansı</h3>
            <Link href="/countries" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Detay <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {COUNTRY_PERF.map(c => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-xl w-7 text-center flex-shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-semibold', c.found > 0 ? 'text-emerald-600' : 'text-slate-400')}>
                        {c.found} bulundu
                      </span>
                      {c.bots > 0 && (
                        <span className="text-xs text-slate-400">{c.bots} bot</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={cn('h-1.5 rounded-full', c.rate > 0 ? 'bg-blue-500' : 'bg-slate-200')}
                      style={{ width: `${c.rate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">%{c.rate} başarı</span>
                    {c.trend !== 0 && (
                      <span className={cn('text-xs font-medium', c.trend > 0 ? 'text-emerald-500' : 'text-red-400')}>
                        {c.trend > 0 ? '↑' : '↓'} {Math.abs(c.trend)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bugünün öne çıkanı */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-700">Bugünün Öne Çıkanı</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  İtalya Bot #2, Milano ofisinde Akif Can için 15 Ağustos randevusunu aldı.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bot durum tablosu + Son randevular ───────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Kompakt bot tablosu */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Bot İzleme</h3>
              <p className="text-xs text-slate-400 mt-0.5">Gerçek zamanlı durum</p>
            </div>
            <Link href="/bots" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Yönet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {MOCK_BOTS.map(bot => {
              const cfg = botStatusCfg[bot.status]
              return (
                <div key={bot.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  {/* Durum noktası */}
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0 mt-0.5', cfg.dot)} />

                  {/* Emoji + isim */}
                  <div className="w-36 min-w-0 flex-shrink-0">
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                      <span>{bot.emoji}</span>
                      <span className="truncate">{bot.name}</span>
                    </p>
                  </div>

                  {/* Görev */}
                  <div className="flex-1 min-w-0 hidden md:block">
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      {bot.status === 'running' && <Timer className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                      {bot.status === 'error'   && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                      {bot.task}
                    </p>
                  </div>

                  {/* Metrikler */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-800">{bot.attempts}</p>
                      <p className="text-xs text-slate-400">deneme</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className={cn('text-xs font-semibold', bot.found > 0 ? 'text-emerald-600' : 'text-slate-400')}>
                        {bot.found}
                      </p>
                      <p className="text-xs text-slate-400">bulunan</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-600">%{bot.rate}</p>
                      <p className="text-xs text-slate-400">başarı</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{bot.lastSeen}</p>
                      <p className="text-xs text-slate-300">önce</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Son randevular */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Son Randevular</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bugün bulunan / alınan</p>
            </div>
            <Link href="/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Tümü <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {MOCK_APPOINTMENTS.map(appt => (
              <div key={appt.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{appt.applicant}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <span>{appt.country}</span>
                      <MapPin className="w-3 h-3" />
                      <span>{appt.city}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{appt.date} · {appt.time}</p>
                  </div>
                  <Badge variant={appt.status === 'booked' ? 'success' : 'info'} dot>
                    {appt.status === 'booked' ? 'Rezerve' : 'Bulundu'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Son sistem logları ────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Son Sistem Logları</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Canlı</span>
            </div>
          </div>
          <Link href="/logs" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            Tümünü Gör <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <LogTable logs={MOCK_LOGS} compact={false} />
      </div>
    </div>
  )
}
