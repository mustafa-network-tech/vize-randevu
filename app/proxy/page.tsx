import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Plus, RefreshCw, Wifi, WifiOff, AlertTriangle, Bot, Clock } from 'lucide-react'

type ProxyStatus = 'online' | 'slow' | 'offline'

interface Proxy {
  id: number
  ip: string
  port: number
  country: string
  countryEmoji: string
  provider: string
  status: ProxyStatus
  ping: number | null
  lastCheck: string
  assignedBot: string | null
  totalRequests: number
  uptime: number
}

const MOCK_PROXIES: Proxy[] = [
  { id: 1, ip: '185.220.101.xx', port: 9080, country: 'Türkiye',  countryEmoji: '🇹🇷', provider: 'BrightData',  status: 'online',  ping: 42,  lastCheck: '1 dk önce',  assignedBot: 'İtalya Bot #1',   totalRequests: 4821, uptime: 99 },
  { id: 2, ip: '91.108.4.xx',    port: 9081, country: 'Hollanda', countryEmoji: '🇳🇱', provider: 'Oxylabs',     status: 'online',  ping: 67,  lastCheck: '2 dk önce',  assignedBot: 'Hollanda Bot #1', totalRequests: 2134, uptime: 97 },
  { id: 3, ip: '104.200.73.xx',  port: 9082, country: 'Almanya',  countryEmoji: '🇩🇪', provider: 'BrightData',  status: 'slow',    ping: 284, lastCheck: '5 dk önce',  assignedBot: 'Almanya Bot #1',  totalRequests: 891,  uptime: 72 },
  { id: 4, ip: '198.199.67.xx',  port: 9083, country: 'Fransa',   countryEmoji: '🇫🇷', provider: 'Oxylabs',     status: 'offline', ping: null,lastCheck: '18 dk önce', assignedBot: null,              totalRequests: 312,  uptime: 0  },
  { id: 5, ip: '167.99.148.xx',  port: 9084, country: 'İtalya',   countryEmoji: '🇮🇹', provider: 'BrightData',  status: 'online',  ping: 38,  lastCheck: '1 dk önce',  assignedBot: 'İtalya Bot #2',   totalRequests: 6203, uptime: 99 },
  { id: 6, ip: '206.189.89.xx',  port: 9085, country: 'Hollanda', countryEmoji: '🇳🇱', provider: 'Oxylabs',     status: 'online',  ping: 71,  lastCheck: '3 dk önce',  assignedBot: 'Hollanda Bot #2', totalRequests: 1547, uptime: 96 },
  { id: 7, ip: '159.89.49.xx',   port: 9086, country: 'Türkiye',  countryEmoji: '🇹🇷', provider: 'BrightData',  status: 'online',  ping: 45,  lastCheck: '2 dk önce',  assignedBot: null,              totalRequests: 0,    uptime: 98 },
  { id: 8, ip: '142.93.104.xx',  port: 9087, country: 'Almanya',  countryEmoji: '🇩🇪', provider: 'Smartproxy',  status: 'slow',    ping: 198, lastCheck: '7 dk önce',  assignedBot: null,              totalRequests: 234,  uptime: 61 },
]

const statusCfg: Record<ProxyStatus, {
  label: string; dot: string; bg: string; text: string; icon: typeof Wifi
}> = {
  online:  { label: 'Online',  dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-400', icon: Wifi         },
  slow:    { label: 'Yavaş',   dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-400',     icon: AlertTriangle },
  offline: { label: 'Offline', dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-950',         text: 'text-red-700 dark:text-red-400',         icon: WifiOff       },
}

const counts = {
  online:  MOCK_PROXIES.filter(p => p.status === 'online').length,
  slow:    MOCK_PROXIES.filter(p => p.status === 'slow').length,
  offline: MOCK_PROXIES.filter(p => p.status === 'offline').length,
  free:    MOCK_PROXIES.filter(p => !p.assignedBot).length,
}

export default function ProxyPage() {
  return (
    <div className="space-y-6">

      {/* KPI özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Online',    value: counts.online,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
          { label: 'Yavaş',     value: counts.slow,    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400'         },
          { label: 'Offline',   value: counts.offline, color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400'                 },
          { label: 'Boşta',     value: counts.free,    color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300'        },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <p className={cn('text-2xl font-bold', item.color.split(' ')[0])}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label} Proxy</p>
            <div className={cn('w-full h-1 rounded-full mt-2', item.color.split(' ').slice(1).join(' '))}>
              <div className="h-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Başlık + butonlar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Proxy Havuzu</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><RefreshCw className="w-3 h-3" />Hepsini Test Et</Button>
          <Button size="sm"><Plus className="w-3 h-3" />Proxy Ekle</Button>
        </div>
      </div>

      {/* Proxy kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_PROXIES.map(proxy => {
          const sc = statusCfg[proxy.status]
          return (
            <div key={proxy.id} className={cn(
              'bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-5 hover:shadow-md transition-all',
              proxy.status === 'offline' ? 'border-red-200 dark:border-red-900' :
              proxy.status === 'slow'    ? 'border-amber-200 dark:border-amber-900' :
              'border-slate-200 dark:border-slate-800'
            )}>
              {/* Başlık */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', sc.dot,
                      proxy.status === 'online' ? 'animate-pulse' : ''
                    )} />
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {proxy.ip}:{proxy.port}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span>{proxy.countryEmoji}</span>
                    <span>{proxy.country}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{proxy.provider}</span>
                  </div>
                </div>
                <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.bg, sc.text)}>
                  <sc.icon className="w-3 h-3" />
                  {sc.label}
                </div>
              </div>

              {/* Metrikler */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                  <p className={cn('text-base font-bold', proxy.ping
                    ? proxy.ping < 100 ? 'text-emerald-600' : proxy.ping < 200 ? 'text-amber-600' : 'text-red-500'
                    : 'text-slate-400')}>
                    {proxy.ping ? `${proxy.ping}ms` : '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Ping</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                  <p className={cn('text-base font-bold',
                    proxy.uptime >= 95 ? 'text-emerald-600' :
                    proxy.uptime >= 70 ? 'text-amber-600' : 'text-red-500')}>
                    %{proxy.uptime}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Uptime</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 text-center">
                  <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                    {proxy.totalRequests > 1000
                      ? `${(proxy.totalRequests / 1000).toFixed(1)}k`
                      : proxy.totalRequests}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">İstek</p>
                </div>
              </div>

              {/* Alt bilgi */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  {proxy.assignedBot ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Bot className="w-3 h-3 text-blue-500" />
                      <span className="font-medium">{proxy.assignedBot}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Bot atanmadı</span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {proxy.lastCheck}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm">Test</Button>
                  {proxy.status === 'offline' && (
                    <Button variant="danger" size="sm"><RefreshCw className="w-3 h-3" /></Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sağlık özeti tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sağlık Özeti</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['IP Adresi', 'Sağlayıcı', 'Ülke', 'Ping', 'Uptime', 'Atanan Bot', 'Durum'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {MOCK_PROXIES.map(proxy => {
                const sc = statusCfg[proxy.status]
                return (
                  <tr key={proxy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {proxy.ip}:{proxy.port}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{proxy.provider}</td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{proxy.countryEmoji} {proxy.country}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-xs font-semibold',
                        !proxy.ping ? 'text-slate-400' :
                        proxy.ping < 100 ? 'text-emerald-600' :
                        proxy.ping < 200 ? 'text-amber-600' : 'text-red-500')}>
                        {proxy.ping ? `${proxy.ping} ms` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className={cn('h-1.5 rounded-full',
                              proxy.uptime >= 95 ? 'bg-emerald-500' :
                              proxy.uptime >= 70 ? 'bg-amber-500' : 'bg-red-500')}
                            style={{ width: `${proxy.uptime}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 dark:text-slate-300">%{proxy.uptime}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {proxy.assignedBot ?? <span className="text-slate-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', sc.bg, sc.text)}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', sc.dot)} />
                        {sc.label}
                      </div>
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
