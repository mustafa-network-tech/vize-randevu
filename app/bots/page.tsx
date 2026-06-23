import { BotStatusCard, BotData } from '@/components/bots/BotStatusCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Play, Square, RefreshCw, Plus, Activity,
  Wifi, WifiOff, Clock, Target, TrendingUp, CalendarCheck
} from 'lucide-react'
import { cn } from '@/lib/helpers/cn'

/* ── Mock veriler ─────────────────────────────────────────── */

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
    currentTask: 'Roma — Schengen vizesi kontrol ediliyor',
  },
  {
    id: 2,
    name: 'İtalya Bot #2',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    status: 'running',
    lastActivity: '1 dk önce',
    todayAttempts: 201,
    todayFound: 5,
    successRate: 87,
    currentTask: 'Milano — 15 Ağustos slotları taranıyor',
  },
  {
    id: 3,
    name: 'Hollanda Bot #1',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    status: 'running',
    lastActivity: '5 dk önce',
    todayAttempts: 89,
    todayFound: 1,
    successRate: 74,
    currentTask: 'Amsterdam — Müsait slot aranıyor',
  },
  {
    id: 4,
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
    id: 5,
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
    id: 6,
    name: 'Hollanda Bot #2',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    status: 'idle',
    lastActivity: '10 dk önce',
    todayAttempts: 12,
    todayFound: 0,
    successRate: 45,
  },
]

// Konfigürasyon detayları (BotData'ya eklenemediği için ayrı tutuyoruz)
const BOT_CONFIG: Record<number, {
  proxy: string
  interval: number
  cities: string[]
  dailyTarget: number
  uptime: string
  lastSuccess?: string
}> = {
  1: { proxy: 'BrightData TR-01', interval: 45, cities: ['Roma', 'Floransa'],   dailyTarget: 200, uptime: '14s 23dk', lastSuccess: '22:35' },
  2: { proxy: 'BrightData TR-02', interval: 38, cities: ['Milano', 'Venedik'],  dailyTarget: 250, uptime: '14s 21dk', lastSuccess: '22:43' },
  3: { proxy: 'Oxylabs NL-07',    interval: 52, cities: ['Amsterdam'],           dailyTarget: 150, uptime: '09s 45dk', lastSuccess: '21:55' },
  4: { proxy: 'Oxylabs DE-03',    interval: 60, cities: ['Berlin', 'Münih'],     dailyTarget: 100, uptime: '0s',       lastSuccess: undefined },
  5: { proxy: 'BrightData FR-01', interval: 55, cities: ['Paris'],              dailyTarget: 100, uptime: '0s',       lastSuccess: undefined },
  6: { proxy: 'Oxylabs NL-12',    interval: 50, cities: ['Rotterdam'],           dailyTarget: 120, uptime: '02s 10dk', lastSuccess: undefined },
}

// 7 günlük performans tablosu
const WEEKLY_PERF = [
  { bot: 'İtalya Bot #1',   emoji: '🇮🇹', mon: 18, tue: 22, wed: 15, thu: 27, fri: 19, sat: 21, sun: 23, total: 145 },
  { bot: 'İtalya Bot #2',   emoji: '🇮🇹', mon: 25, tue: 31, wed: 28, thu: 35, fri: 30, sat: 27, sun: 25, total: 201 },
  { bot: 'Hollanda Bot #1', emoji: '🇳🇱', mon: 12, tue: 14, wed:  9, thu: 18, fri: 15, sat: 11, sun: 10, total:  89 },
  { bot: 'Almanya Bot #1',  emoji: '🇩🇪', mon:  8, tue: 11, wed:  5, thu:  0, fri:  6, sat:  4, sun:  0, total:  34 },
  { bot: 'Fransa Bot #1',   emoji: '🇫🇷', mon:  0, tue:  0, wed:  0, thu:  0, fri:  0, sat:  0, sun:  0, total:   0 },
  { bot: 'Hollanda Bot #2', emoji: '🇳🇱', mon:  3, tue:  4, wed:  2, thu:  0, fri:  2, sat:  1, sun:  0, total:  12 },
]
const DAYS = ['Pzt', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cmt', 'Bug'] as const

const statusCounts = {
  running: MOCK_BOTS.filter(b => b.status === 'running').length,
  error:   MOCK_BOTS.filter(b => b.status === 'error').length,
  stopped: MOCK_BOTS.filter(b => b.status === 'stopped' || b.status === 'idle').length,
}

/* ── Sayfa ─────────────────────────────────────────────────── */

export default function BotsPage() {
  const totalAttempts = MOCK_BOTS.reduce((s, b) => s + b.todayAttempts, 0)
  const totalFound    = MOCK_BOTS.reduce((s, b) => s + b.todayFound, 0)
  const activeBots    = MOCK_BOTS.filter(b => b.successRate > 0)
  const avgSuccess    = activeBots.length
    ? Math.round(activeBots.reduce((s, b) => s + b.successRate, 0) / activeBots.length)
    : 0

  return (
    <div className="space-y-6">

      {/* ── Üst KPI + butonlar ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { icon: Activity,      label: 'Aktif',       value: statusCounts.running, dot: 'bg-emerald-400' },
            { icon: WifiOff,       label: 'Hatalı',      value: statusCounts.error,   dot: 'bg-red-500'     },
            { icon: Square,        label: 'Pasif',        value: statusCounts.stopped, dot: 'bg-slate-400'   },
            { icon: Target,        label: 'Bugün Deneme', value: totalAttempts,        dot: 'bg-blue-400'    },
            { icon: CalendarCheck, label: 'Bulunan',      value: totalFound,           dot: 'bg-emerald-500' },
          ].map(item => (
            <div key={item.label} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', item.dot)} />
              <span className="text-sm font-bold text-slate-800">{item.value}</span>
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Square   className="w-3 h-3" />Tümünü Durdur</Button>
          <Button variant="secondary" size="sm"><Play     className="w-3 h-3" />Tümünü Başlat</Button>
          <Button size="sm">                  <Plus     className="w-3 h-3" />Yeni Bot</Button>
        </div>
      </div>

      {/* ── Hata uyarısı ─────────────────────────────────────── */}
      {statusCounts.error > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <WifiOff className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {statusCounts.error} bot hata durumunda — acil müdahale gerekebilir
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Almanya Bot #1 — VFS Germany sunucusuna bağlantı kurulamıyor. Son deneme 23 dk önce.
              Proxy değiştirmeyi veya VFS hesabını kontrol etmeyi deneyin.
            </p>
          </div>
          <Button variant="danger" size="sm" className="flex-shrink-0">
            <RefreshCw className="w-3 h-3" />Yeniden Başlat
          </Button>
        </div>
      )}

      {/* ── Bot kartları ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-700">Tüm Botlar</h2>
          <div className="flex gap-1.5">
            {(['Tümü', 'Çalışıyor', 'Hata', 'Durduruldu'] as const).map((f, i) => (
              <button key={f} className={cn(
                'text-xs px-3 py-1 rounded-full font-medium transition-colors',
                i === 0 ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_BOTS.map(bot => (
            <BotStatusCard key={bot.id} bot={bot} />
          ))}
        </div>
      </div>

      {/* ── Bot konfigürasyon tablosu ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Bot Konfigürasyonları</h3>
          <p className="text-xs text-slate-400 mt-0.5">Proxy, tarama aralığı ve hedef şehir bilgileri</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Bot', 'Durum', 'Proxy', 'Tarama Aralığı', 'Hedef Şehirler', 'Uptime', 'Son Başarı'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_BOTS.map(bot => {
                const cfg = BOT_CONFIG[bot.id]
                const isOk = bot.status === 'running'
                return (
                  <tr key={bot.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {bot.countryEmoji} {bot.name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={bot.status === 'running' ? 'success' : bot.status === 'error' ? 'error' : 'default'}
                        dot
                      >
                        {bot.status === 'running' ? 'Çalışıyor' : bot.status === 'error' ? 'Hata' : bot.status === 'stopped' ? 'Durdu' : 'Bekliyor'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {isOk
                          ? <Wifi    className="w-3 h-3 text-emerald-500" />
                          : <WifiOff className="w-3 h-3 text-slate-400" />
                        }
                        <span className="text-xs text-slate-600">{cfg.proxy}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600">{cfg.interval}s</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap max-w-[180px]">
                        {cfg.cities.map(c => (
                          <span key={c} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">{cfg.uptime}</td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {cfg.lastSuccess
                        ? <span className="text-emerald-600 font-semibold">{cfg.lastSuccess}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Haftalık performans tablosu ───────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Haftalık Deneme Dağılımı</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bugün dahil son 7 gün — başarılı slot bulma sayısı</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            Haftalık toplam: <span className="font-bold text-slate-700 ml-1">{WEEKLY_PERF.reduce((s, r) => s + r.total, 0)} deneme</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5 w-44">Bot</th>
                {DAYS.map((d, i) => (
                  <th key={d} className={cn(
                    'text-center text-xs font-semibold py-3 px-3',
                    i === 6 ? 'text-blue-600' : 'text-slate-500'
                  )}>
                    {d}
                    {i === 6 && <span className="block text-xs text-blue-400 font-normal">bugün</span>}
                  </th>
                ))}
                <th className="text-right text-xs font-semibold text-slate-500 py-3 px-5">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {WEEKLY_PERF.map(row => {
                const vals = [row.mon, row.tue, row.wed, row.thu, row.fri, row.sat, row.sun]
                const max  = Math.max(...vals)
                return (
                  <tr key={row.bot} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-medium text-slate-800 whitespace-nowrap">
                      {row.emoji} {row.bot}
                    </td>
                    {vals.map((v, i) => (
                      <td key={i} className="py-3 px-3 text-center">
                        <span className={cn(
                          'inline-flex items-center justify-center w-8 h-7 rounded text-xs font-semibold',
                          v === 0   ? 'text-slate-300'
                            : v === max && max > 0 ? 'bg-blue-600 text-white'
                            : v >= max * 0.7       ? 'bg-blue-100 text-blue-700'
                            : 'text-slate-600'
                        )}>
                          {v || '—'}
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-5 text-right font-bold text-slate-800">{row.total}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-3 px-5 text-xs font-semibold text-slate-600">Günlük Toplam</td>
                {[
                  WEEKLY_PERF.reduce((s, r) => s + r.mon, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.tue, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.wed, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.thu, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.fri, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.sat, 0),
                  WEEKLY_PERF.reduce((s, r) => s + r.sun, 0),
                ].map((v, i) => (
                  <td key={i} className={cn(
                    'py-3 px-3 text-center text-xs font-bold',
                    i === 6 ? 'text-blue-600' : 'text-slate-700'
                  )}>
                    {v}
                  </td>
                ))}
                <td className="py-3 px-5 text-right text-xs font-bold text-slate-700">
                  {WEEKLY_PERF.reduce((s, r) => s + r.total, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Bugünün özeti ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Bugünün Performansı</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Deneme',   value: totalAttempts,        color: 'bg-blue-50',    text: 'text-blue-700'    },
            { label: 'Bulunan Randevu', value: totalFound,           color: 'bg-emerald-50', text: 'text-emerald-700' },
            { label: 'Ort. Başarı',    value: `%${avgSuccess}`,      color: 'bg-violet-50',  text: 'text-violet-700'  },
            { label: 'Toplam Uptime',  value: '14.2 sa',             color: 'bg-slate-50',   text: 'text-slate-700'   },
          ].map(item => (
            <div key={item.label} className={cn('rounded-xl p-4', item.color)}>
              <p className={cn('text-2xl font-bold', item.text)}>{item.value}</p>
              <p className="text-xs text-slate-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
