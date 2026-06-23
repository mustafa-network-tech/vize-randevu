import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Play, Square, Edit, Clock, Timer, Shuffle, CalendarDays } from 'lucide-react'

interface BotSchedule {
  id: number
  name: string
  country: string
  countryEmoji: string
  status: 'running' | 'stopped' | 'error' | 'idle'
  startHour: number
  endHour: number
  interval: number
  waitMin: number
  waitMax: number
  randomDelay: boolean
  activeDays: number[]
  priority: 'high' | 'medium' | 'low'
}

const BOTS: BotSchedule[] = [
  { id: 1, name: 'Italy Bot 1',       country: 'İtalya',   countryEmoji: '🇮🇹', status: 'running', startHour:  7, endHour: 23, interval: 45, waitMin: 30, waitMax: 90,  randomDelay: true,  activeDays: [1,2,3,4,5,6,7], priority: 'high'   },
  { id: 2, name: 'Italy Bot 2',       country: 'İtalya',   countryEmoji: '🇮🇹', status: 'running', startHour:  6, endHour: 22, interval: 38, waitMin: 25, waitMax: 75,  randomDelay: true,  activeDays: [1,2,3,4,5,6,7], priority: 'high'   },
  { id: 3, name: 'Italy Bot 3',       country: 'İtalya',   countryEmoji: '🇮🇹', status: 'idle',    startHour:  8, endHour: 20, interval: 60, waitMin: 40, waitMax: 120, randomDelay: false, activeDays: [1,2,3,4,5],     priority: 'medium' },
  { id: 4, name: 'Netherlands Bot 1', country: 'Hollanda', countryEmoji: '🇳🇱', status: 'running', startHour:  7, endHour: 21, interval: 52, waitMin: 35, waitMax: 100, randomDelay: true,  activeDays: [1,2,3,4,5,6,7], priority: 'high'   },
  { id: 5, name: 'Netherlands Bot 2', country: 'Hollanda', countryEmoji: '🇳🇱', status: 'idle',    startHour:  9, endHour: 23, interval: 55, waitMin: 40, waitMax: 110, randomDelay: true,  activeDays: [1,2,3,4,5,6],   priority: 'medium' },
  { id: 6, name: 'Netherlands Bot 3', country: 'Hollanda', countryEmoji: '🇳🇱', status: 'stopped', startHour:  6, endHour: 18, interval: 48, waitMin: 30, waitMax: 90,  randomDelay: false, activeDays: [1,2,3,4,5],     priority: 'low'    },
  { id: 7, name: 'Germany Bot',       country: 'Almanya',  countryEmoji: '🇩🇪', status: 'error',   startHour:  8, endHour: 20, interval: 60, waitMin: 45, waitMax: 120, randomDelay: true,  activeDays: [1,2,3,4,5],     priority: 'medium' },
  { id: 8, name: 'France Bot',        country: 'Fransa',   countryEmoji: '🇫🇷', status: 'stopped', startHour: 10, endHour: 22, interval: 55, waitMin: 40, waitMax: 100, randomDelay: true,  activeDays: [1,2,3,4,5],     priority: 'low'    },
]

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06–23
const CURRENT_HOUR = 22

const statusCfg = {
  running: { label: 'Çalışıyor', dot: 'bg-emerald-400 animate-pulse', barColor: 'bg-blue-500' },
  stopped: { label: 'Durduruldu', dot: 'bg-slate-400', barColor: 'bg-slate-200 dark:bg-slate-700' },
  error:   { label: 'Hata',      dot: 'bg-red-500',   barColor: 'bg-red-300 dark:bg-red-800'    },
  idle:    { label: 'Bekliyor',  dot: 'bg-amber-400',  barColor: 'bg-amber-200 dark:bg-amber-800' },
}

const priorityCfg = {
  high:   { label: 'Yüksek', variant: 'error'   as const },
  medium: { label: 'Orta',   variant: 'warning' as const },
  low:    { label: 'Düşük',  variant: 'default' as const },
}

const DAY_LABELS = ['Pts', 'Sal', 'Çrş', 'Prş', 'Cum', 'Cmt', 'Paz']

export default function SchedulerPage() {
  const running = BOTS.filter(b => b.status === 'running').length

  return (
    <div className="space-y-6">

      {/* Üst bilgi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{running}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">bot aktif şu an</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">22:47</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">mevcut saat</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Square className="w-3 h-3" />Tümünü Durdur</Button>
          <Button size="sm"><Play className="w-3 h-3" />Tümünü Başlat</Button>
        </div>
      </div>

      {/* Saat takvimi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Günlük Çalışma Takvimi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Her bot için saatlik çalışma penceresi</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-blue-500 rounded inline-block" />Aktif</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-300 rounded inline-block dark:bg-amber-700" />Bekliyor</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-slate-200 rounded inline-block dark:bg-slate-700" />Pasif</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="sticky left-0 bg-white dark:bg-slate-900 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 min-w-[160px] z-10">
                  Bot
                </th>
                {HOURS.map(h => (
                  <th key={h} className={cn(
                    'text-center text-xs font-semibold py-3 px-1 min-w-[36px] whitespace-nowrap',
                    h === CURRENT_HOUR ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {h.toString().padStart(2, '0')}
                    {h === CURRENT_HOUR && <div className="w-1 h-1 bg-blue-500 rounded-full mx-auto mt-0.5" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {BOTS.map(bot => {
                const sc = statusCfg[bot.status]
                return (
                  <tr key={bot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="sticky left-0 bg-white dark:bg-slate-900 py-2.5 px-4 z-10">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{bot.countryEmoji} {bot.name}</p>
                        </div>
                      </div>
                    </td>
                    {HOURS.map(h => {
                      const isActive = h >= bot.startHour && h < bot.endHour
                      const isCurrent = h === CURRENT_HOUR && isActive && bot.status === 'running'
                      return (
                        <td key={h} className="py-2 px-0.5 text-center">
                          <div className={cn(
                            'h-6 rounded transition-all',
                            isActive ? sc.barColor : 'bg-transparent',
                            isCurrent ? 'ring-2 ring-blue-400 ring-offset-1' : ''
                          )} />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bot konfigürasyon tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bot Zamanlama Konfigürasyonu</h3>
          <p className="text-xs text-slate-400 mt-0.5">Her bot için çalışma parametreleri ve aktif günler</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Bot', 'Durum', 'Öncelik', 'Çalışma Saatleri', 'Aralık', 'Bekleme', 'Rand. Gecikme', 'Aktif Günler', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {BOTS.map(bot => {
                const sc = statusCfg[bot.status]
                const pc = priorityCfg[bot.priority]
                return (
                  <tr key={bot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot)} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{bot.countryEmoji} {bot.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={bot.status === 'running' ? 'success' : bot.status === 'error' ? 'error' : bot.status === 'idle' ? 'warning' : 'default'}
                        dot
                      >
                        {sc.label}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={pc.variant}>{pc.label}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{bot.startHour.toString().padStart(2,'0')}:00 — {bot.endHour.toString().padStart(2,'0')}:00</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <Timer className="w-3 h-3 text-slate-400" />
                        {bot.interval}s
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {bot.waitMin}s — {bot.waitMax}s
                    </td>
                    <td className="py-3 px-4 text-center">
                      {bot.randomDelay
                        ? <Shuffle className="w-4 h-4 text-blue-500 mx-auto" />
                        : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      }
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-0.5">
                        {DAY_LABELS.map((d, i) => (
                          <span key={d} className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            bot.activeDays.includes(i + 1)
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'text-slate-300 dark:text-slate-600'
                          )}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm"><Edit className="w-3 h-3" /></Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Haftalık özet */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-500" />
          Bu Hafta Planlanan Toplam Çalışma
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Bot Saati',   value: `${BOTS.reduce((s,b) => s + (b.endHour - b.startHour), 0) * 7} sa`, color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' },
            { label: 'Aktif Bot',          value: `${running}/8`,   color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
            { label: 'Ort. Tarama Aralığı',value: `${Math.round(BOTS.reduce((s,b) => s + b.interval, 0) / BOTS.length)}s`, color: 'bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300' },
            { label: 'Kapsanan Ülke',      value: '4 ülke',         color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'         },
          ].map(item => (
            <div key={item.label} className={cn('rounded-xl p-4', item.color)}>
              <p className="text-xl font-bold">{item.value}</p>
              <p className="text-xs mt-1 opacity-70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
