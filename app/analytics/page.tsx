import { cn } from '@/lib/helpers/cn'
import { TrendingUp, TrendingDown, CalendarCheck, Bot, Timer, Fingerprint } from 'lucide-react'

/* ── Mock veriler ─────────────────────────────────────────── */

const COUNTRY_DATA = [
  { name: 'İtalya',   emoji: '🇮🇹', found: 47, attempts: 3241, rate: 85, color: '#3b82f6' },
  { name: 'Hollanda', emoji: '🇳🇱', found: 18, attempts: 1034, rate: 74, color: '#8b5cf6' },
  { name: 'Almanya',  emoji: '🇩🇪', found:  4, attempts:  612, rate: 42, color: '#f59e0b' },
  { name: 'Fransa',   emoji: '🇫🇷', found:  2, attempts:  198, rate: 30, color: '#ec4899' },
]
const MAX_FOUND = 47

const WEEKLY = [
  { day: 'Pzt', found: 8,  attempts: 892,  captcha: 12, avgMs: 2840 },
  { day: 'Sal', found: 11, attempts: 1043, captcha: 15, avgMs: 3120 },
  { day: 'Çrş', found: 7,  attempts: 876,  captcha: 9,  avgMs: 2750 },
  { day: 'Prş', found: 14, attempts: 1187, captcha: 18, avgMs: 2980 },
  { day: 'Cum', found: 9,  attempts: 1034, captcha: 13, avgMs: 3050 },
  { day: 'Cmt', found: 10, attempts: 998,  captcha: 11, avgMs: 2810 },
  { day: 'Bug', found: 9,  attempts: 481,  captcha: 7,  avgMs: 2650 },
]
const WEEKLY_MAX_FOUND = 14
const WEEKLY_MAX_ATT   = 1187

const HOURLY_RATE = [
  { h:  7, rate: 62 }, { h:  8, rate: 71 }, { h:  9, rate: 78 },
  { h: 10, rate: 84 }, { h: 11, rate: 81 }, { h: 12, rate: 76 },
  { h: 13, rate: 74 }, { h: 14, rate: 79 }, { h: 15, rate: 83 },
  { h: 16, rate: 87 }, { h: 17, rate: 85 }, { h: 18, rate: 80 },
  { h: 19, rate: 78 }, { h: 20, rate: 75 }, { h: 21, rate: 72 },
  { h: 22, rate: 78 }, { h: 23, rate: 65 },
]

const BOT_PERF = [
  { name: 'İtalya Bot #1',    emoji: '🇮🇹', found: 21, attempts: 1187, rate: 82, captcha: 14 },
  { name: 'İtalya Bot #2',    emoji: '🇮🇹', found: 26, attempts: 2054, rate: 87, captcha: 12 },
  { name: 'Hollanda Bot #1',  emoji: '🇳🇱', found: 11, attempts:  756, rate: 74, captcha:  9 },
  { name: 'Hollanda Bot #2',  emoji: '🇳🇱', found:  7, attempts:  278, rate: 68, captcha:  6 },
  { name: 'Almanya Bot #1',   emoji: '🇩🇪', found:  4, attempts:  612, rate: 42, captcha: 19 },
  { name: 'Fransa Bot #1',    emoji: '🇫🇷', found:  2, attempts:  198, rate: 30, captcha:  8 },
]

/* ── KPI bileşeni ─────────────────────────────────────────── */

function KpiCard({ title, value, sub, icon: Icon, trend, color }: {
  title: string; value: string; sub: string
  icon: typeof TrendingUp; trend: number; color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
      <p className={cn('text-xs font-semibold mt-2 flex items-center gap-1', trend >= 0 ? 'text-emerald-600' : 'text-red-500')}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        %{Math.abs(trend)} geçen haftadan {trend >= 0 ? 'fazla' : 'az'}
      </p>
    </div>
  )
}

/* ── Sayfa ─────────────────────────────────────────────────── */

export default function AnalyticsPage() {
  const totalFound    = WEEKLY.reduce((s, d) => s + d.found, 0)
  const totalAttempts = WEEKLY.reduce((s, d) => s + d.attempts, 0)
  const totalCaptcha  = WEEKLY.reduce((s, d) => s + d.captcha, 0)
  const avgRate       = Math.round(WEEKLY.reduce((s, d) => s + (d.found / d.attempts * 100), 0) / WEEKLY.length)

  return (
    <div className="space-y-6">

      {/* KPI satırı */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Bulunan Randevu"  value={totalFound.toString()}                                          sub="Bu hafta toplam"         icon={CalendarCheck} trend={12.5}  color="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" />
        <KpiCard title="Toplam Deneme"    value={totalAttempts.toLocaleString('tr-TR')}                          sub="Tüm botlar"              icon={Bot}           trend={8.3}   color="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"             />
        <KpiCard title="Ort. Başarı Oranı"value={`%${avgRate}`}                                                  sub="Haftalık ortalama"       icon={TrendingUp}    trend={3.2}   color="bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400"         />
        <KpiCard title="CAPTCHA Sayısı"   value={totalCaptcha.toString()}                                        sub="Bu hafta tetiklenen"     icon={Fingerprint}   trend={-5.1}  color="bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400"     />
      </div>

      {/* Ana grafik satırı */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Ülkelere göre bulunan randevular */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Ülkelere Göre Randevu</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Bu hafta bulunan toplam</p>

          {/* SVG yatay bar chart */}
          <svg viewBox="0 0 280 160" className="w-full" role="img" aria-label="Ülke performans grafiği">
            {COUNTRY_DATA.map((c, i) => {
              const barW = Math.round((c.found / MAX_FOUND) * 200)
              const y = i * 38 + 10
              return (
                <g key={c.name}>
                  <text x="0" y={y + 12} fontSize="11" fill="#94a3b8">{c.emoji} {c.name}</text>
                  <rect x="0" y={y + 16} width={barW} height="12" rx="4" fill={c.color} fillOpacity="0.8" />
                  <text x={barW + 6} y={y + 26} fontSize="10" fontWeight="600" fill={c.color}>{c.found}</text>
                </g>
              )
            })}
          </svg>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
            {COUNTRY_DATA.map(c => (
              <div key={c.name} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-300">{c.name}</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 ml-auto">%{c.rate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Haftalık trend */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Haftalık Trend</h3>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-500 rounded-sm inline-block" />Deneme</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" />Bulunan</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">7 günlük performans karşılaştırması</p>

          <div className="flex items-end gap-3 h-36">
            {WEEKLY.map((d, i) => {
              const attH  = Math.round((d.attempts  / WEEKLY_MAX_ATT)   * 100)
              const findH = Math.round((d.found     / WEEKLY_MAX_FOUND) * 100)
              const isToday = i === 6
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{d.found}</span>
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '85%' }}>
                    <div
                      className={cn('flex-1 rounded-t', isToday ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900')}
                      style={{ height: `${attH}%` }}
                    />
                    <div
                      className={cn('flex-1 rounded-t', isToday ? 'bg-emerald-500' : 'bg-emerald-200 dark:bg-emerald-900')}
                      style={{ height: `${findH}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500')}>
                    {d.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Başarı oranı saatlik + Ort. işlem süresi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Saatlik başarı oranı line-like chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Saatlik Başarı Oranı</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Bugün saat bazlı %başarı</p>

          <svg viewBox="0 0 360 80" className="w-full" preserveAspectRatio="none">
            {/* Izgara */}
            {[40, 60, 80, 100].map(v => (
              <line key={v} x1="0" y1={80 - v * 0.75} x2="360" y2={80 - v * 0.75}
                stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {/* Alan */}
            <path
              d={`M 0 ${80 - HOURLY_RATE[0].rate * 0.75} ` +
                HOURLY_RATE.map((p, i) => `L ${(i / (HOURLY_RATE.length - 1)) * 360} ${80 - p.rate * 0.75}`).join(' ') +
                ` L 360 80 L 0 80 Z`}
              fill="#3b82f6" fillOpacity="0.12"
            />
            {/* Çizgi */}
            <polyline
              points={HOURLY_RATE.map((p, i) =>
                `${(i / (HOURLY_RATE.length - 1)) * 360},${80 - p.rate * 0.75}`
              ).join(' ')}
              fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            />
            {/* Mevcut saat noktası */}
            <circle
              cx={((HOURLY_RATE.findIndex(p => p.h === 22)) / (HOURLY_RATE.length - 1)) * 360}
              cy={80 - (HOURLY_RATE.find(p => p.h === 22)?.rate ?? 78) * 0.75}
              r="3.5" fill="#3b82f6"
            />
          </svg>

          <div className="flex items-center justify-between mt-3 text-xs text-slate-400 dark:text-slate-500">
            <span>07:00</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Mevcut: %78</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Ort. işlem süresi */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Ortalama İşlem Süresi</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Bot başına ortalama (ms)</p>
          <div className="space-y-3">
            {BOT_PERF.map(bot => {
              const ms = Math.round(800 + Math.random() * 1200 + bot.found * 10)
              const ref = 3500
              const pct = Math.min(Math.round((ms / ref) * 100), 100)
              return (
                <div key={bot.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-700 dark:text-slate-300">{bot.emoji} {bot.name}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Timer className="w-3 h-3 text-slate-400" />
                      <span className={cn('font-semibold',
                        ms < 2000 ? 'text-emerald-600' : ms < 3000 ? 'text-amber-600' : 'text-red-500')}>
                        {(ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                    <div
                      className={cn('h-2 rounded-full',
                        ms < 2000 ? 'bg-emerald-500' : ms < 3000 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bot performans tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bot Bazlı Haftalık Performans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Bot', 'Bulunan', 'Deneme', 'Başarı Oranı', 'CAPTCHA', 'Verimlilik'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {BOT_PERF.map(bot => {
                const eff = Math.round((bot.found / bot.attempts) * 1000) / 10
                return (
                  <tr key={bot.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{bot.emoji} {bot.name}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{bot.found}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{bot.attempts.toLocaleString('tr-TR')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className={cn('h-1.5 rounded-full',
                              bot.rate >= 80 ? 'bg-emerald-500' :
                              bot.rate >= 60 ? 'bg-blue-500' :
                              bot.rate >= 40 ? 'bg-amber-500' : 'bg-red-500')}
                            style={{ width: `${bot.rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">%{bot.rate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{bot.captcha}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs font-semibold',
                        eff >= 1.5 ? 'text-emerald-600' : eff >= 0.8 ? 'text-blue-600' : 'text-amber-600')}>
                        {eff}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
