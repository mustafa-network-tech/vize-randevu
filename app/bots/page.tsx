import { BotStatusCard, BotData } from '@/components/bots/BotStatusCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Play, Square, RefreshCw, Plus, Activity } from 'lucide-react'

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
    currentTask: 'Amsterdam - Müsait slot aranıyor',
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

const statusCounts = {
  running: MOCK_BOTS.filter((b) => b.status === 'running').length,
  error: MOCK_BOTS.filter((b) => b.status === 'error').length,
  stopped: MOCK_BOTS.filter((b) => b.status === 'stopped' || b.status === 'idle').length,
}

export default function BotsPage() {
  return (
    <div className="space-y-6">
      {/* Üst özet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-slate-800">{statusCounts.running}</span>
            <span className="text-xs text-slate-500">Aktif</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm font-semibold text-slate-800">{statusCounts.error}</span>
            <span className="text-xs text-slate-500">Hatalı</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
            <span className="w-2 h-2 bg-slate-400 rounded-full" />
            <span className="text-sm font-semibold text-slate-800">{statusCounts.stopped}</span>
            <span className="text-xs text-slate-500">Pasif</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <Square className="w-3 h-3" />
            Tümünü Durdur
          </Button>
          <Button variant="secondary" size="sm">
            <Play className="w-3 h-3" />
            Tümünü Başlat
          </Button>
          <Button size="sm">
            <Plus className="w-3 h-3" />
            Yeni Bot
          </Button>
        </div>
      </div>

      {/* Hata uyarısı */}
      {statusCounts.error > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {statusCounts.error} bot hata durumunda
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              Almanya Bot #1 bağlantı kuramıyor. Lütfen VFS Germany bağlantısını kontrol edin.
            </p>
          </div>
          <Button variant="danger" size="sm" className="ml-auto flex-shrink-0">
            <RefreshCw className="w-3 h-3" />
            Yeniden Başlat
          </Button>
        </div>
      )}

      {/* Bot grid */}
      <div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-semibold text-slate-700">Tüm Botlar</h2>
          <div className="flex gap-2">
            {(['Tümü', 'Çalışıyor', 'Hata', 'Durduruldu'] as const).map((filter, i) => (
              <button
                key={filter}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                  i === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MOCK_BOTS.map((bot) => (
            <BotStatusCard key={bot.id} bot={bot} />
          ))}
        </div>
      </div>

      {/* Bugünün özeti */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Bugünün Performansı</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Deneme', value: MOCK_BOTS.reduce((s, b) => s + b.todayAttempts, 0).toString() },
            { label: 'Bulunan Randevu', value: MOCK_BOTS.reduce((s, b) => s + b.todayFound, 0).toString(), highlight: true },
            { label: 'Ortalama Başarı', value: `%${Math.round(MOCK_BOTS.filter(b => b.successRate > 0).reduce((s, b) => s + b.successRate, 0) / MOCK_BOTS.filter(b => b.successRate > 0).length)}` },
            { label: 'Toplam Çalışma', value: '14.2 sa' },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg p-3 ${item.highlight ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <p className={`text-xl font-bold ${item.highlight ? 'text-emerald-600' : 'text-slate-800'}`}>
                {item.value}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
