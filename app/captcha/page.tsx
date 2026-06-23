import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Fingerprint, Clock, CheckCircle, XCircle, Timer, RefreshCw, Zap } from 'lucide-react'

interface CaptchaEvent {
  id: number
  bot: string
  country: string
  countryEmoji: string
  timestamp: string
  status: 'solved' | 'failed' | 'pending'
  duration: string | null
  service: string
  attempts: number
}

const MOCK_EVENTS: CaptchaEvent[] = [
  { id:  1, bot: 'İtalya Bot #2',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:47:03', status: 'solved',  duration: '4.2s',  service: '2Captcha', attempts: 1 },
  { id:  2, bot: 'Hollanda Bot #1', country: 'Hollanda', countryEmoji: '🇳🇱', timestamp: '22:45:18', status: 'solved',  duration: '6.8s',  service: '2Captcha', attempts: 1 },
  { id:  3, bot: 'Almanya Bot #1',  country: 'Almanya',  countryEmoji: '🇩🇪', timestamp: '22:43:30', status: 'failed',  duration: '12.1s', service: 'AntiCaptcha', attempts: 3 },
  { id:  4, bot: 'İtalya Bot #1',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:41:55', status: 'solved',  duration: '3.9s',  service: '2Captcha', attempts: 1 },
  { id:  5, bot: 'Hollanda Bot #1', country: 'Hollanda', countryEmoji: '🇳🇱', timestamp: '22:40:12', status: 'pending', duration: null,    service: '2Captcha', attempts: 0 },
  { id:  6, bot: 'Almanya Bot #1',  country: 'Almanya',  countryEmoji: '🇩🇪', timestamp: '22:38:47', status: 'failed',  duration: '15.0s', service: 'AntiCaptcha', attempts: 5 },
  { id:  7, bot: 'İtalya Bot #2',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:36:20', status: 'solved',  duration: '5.1s',  service: '2Captcha', attempts: 1 },
  { id:  8, bot: 'İtalya Bot #1',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:33:44', status: 'solved',  duration: '4.7s',  service: '2Captcha', attempts: 2 },
  { id:  9, bot: 'Hollanda Bot #2', country: 'Hollanda', countryEmoji: '🇳🇱', timestamp: '22:31:09', status: 'solved',  duration: '7.2s',  service: 'AntiCaptcha', attempts: 1 },
  { id: 10, bot: 'Almanya Bot #1',  country: 'Almanya',  countryEmoji: '🇩🇪', timestamp: '22:28:33', status: 'failed',  duration: '11.4s', service: 'AntiCaptcha', attempts: 4 },
  { id: 11, bot: 'İtalya Bot #2',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:25:57', status: 'solved',  duration: '3.5s',  service: '2Captcha', attempts: 1 },
  { id: 12, bot: 'İtalya Bot #1',   country: 'İtalya',   countryEmoji: '🇮🇹', timestamp: '22:23:21', status: 'solved',  duration: '6.0s',  service: '2Captcha', attempts: 1 },
]

const counts = {
  pending: MOCK_EVENTS.filter(e => e.status === 'pending').length,
  solved:  MOCK_EVENTS.filter(e => e.status === 'solved').length,
  failed:  MOCK_EVENTS.filter(e => e.status === 'failed').length,
  total:   MOCK_EVENTS.length,
}
const solvedDurations = MOCK_EVENTS.filter(e => e.duration && e.status === 'solved')
  .map(e => parseFloat(e.duration!))
const avgDuration = solvedDurations.length
  ? (solvedDurations.reduce((s, d) => s + d, 0) / solvedDurations.length).toFixed(1)
  : '—'

const successRate = Math.round((counts.solved / (counts.solved + counts.failed)) * 100)

// Saatlik çözüm dağılımı (mock)
const HOURLY = [
  { hour: '19', solved: 3, failed: 0 },
  { hour: '20', solved: 5, failed: 1 },
  { hour: '21', solved: 8, failed: 2 },
  { hour: '22', solved: 9, failed: 3 },
]
const HOURLY_MAX = 12

export default function CaptchaPage() {
  return (
    <div className="space-y-6">

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
            note: `Bugün toplam`,
          },
          {
            label: 'Başarısız CAPTCHA',
            value: counts.failed,
            icon: XCircle,
            color: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400',
            note: `%${100 - successRate} başarısızlık oranı`,
          },
          {
            label: 'Ort. Çözüm Süresi',
            value: `${avgDuration}s`,
            icon: Timer,
            color: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
            note: 'Otomatik servis',
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

        {/* SVG başarı donut */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 self-start">Başarı Oranı</h3>
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3"
                className="dark:[stroke:#1e293b]" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3"
                strokeDasharray={`${successRate} ${100 - successRate}`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">%{successRate}</span>
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
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Saatlik Dağılım</h3>
              <p className="text-xs text-slate-400 mt-0.5">Çözülen ve başarısız CAPTCHA sayısı</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" />Çözüldü</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-red-400 rounded-sm inline-block" />Başarısız</span>
            </div>
          </div>
          <div className="flex items-end gap-6 h-32">
            {HOURLY.map(h => {
              const totalH = h.solved + h.failed
              const solvedH = Math.round((h.solved / HOURLY_MAX) * 100)
              const failedH = Math.round((h.failed / HOURLY_MAX) * 100)
              const isNow = h.hour === '22'
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{totalH}</span>
                  <div className="w-full flex gap-1 justify-center items-end" style={{ height: '90%' }}>
                    <div
                      className={cn('flex-1 rounded-t transition-all', isNow ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-900')}
                      style={{ height: `${solvedH}%` }}
                    />
                    <div
                      className={cn('flex-1 rounded-t transition-all', isNow ? 'bg-red-500' : 'bg-red-200 dark:bg-red-900')}
                      style={{ height: `${failedH}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', isNow ? 'text-blue-600' : 'text-slate-400')}>
                    {h.hour}:00
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Son işlemler tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Son İşlemler</h3>
            {counts.pending > 0 && (
              <Badge variant="warning" dot>{counts.pending} bekliyor</Badge>
            )}
          </div>
          <Button variant="secondary" size="sm">
            <RefreshCw className="w-3 h-3" />Yenile
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Bot', 'Ülke', 'Saat', 'Servis', 'Deneme', 'Süre', 'Durum'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {MOCK_EVENTS.map(ev => (
                <tr key={ev.id} className={cn(
                  'transition-colors',
                  ev.status === 'failed'  ? 'bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40' :
                  ev.status === 'pending' ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40' :
                  'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                )}>
                  <td className="py-3 px-4 text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{ev.bot}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{ev.countryEmoji} {ev.country}</td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-400 dark:text-slate-500">{ev.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">{ev.service}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{ev.attempts || '—'}</td>
                  <td className="py-3 px-4">
                    {ev.duration ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className={cn(
                          parseFloat(ev.duration) < 7 ? 'text-emerald-600' :
                          parseFloat(ev.duration) < 10 ? 'text-amber-600' : 'text-red-500'
                        )}>{ev.duration}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <Zap className="w-3 h-3 animate-pulse" />Çözülüyor
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={ev.status === 'solved' ? 'success' : ev.status === 'failed' ? 'error' : 'warning'}
                      dot
                    >
                      {ev.status === 'solved' ? 'Çözüldü' : ev.status === 'failed' ? 'Başarısız' : 'Bekliyor'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
