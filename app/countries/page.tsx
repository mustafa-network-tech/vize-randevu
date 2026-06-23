import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Bot, CalendarCheck, TrendingUp, Plus, Globe } from 'lucide-react'

interface Country {
  id: number
  name: string
  emoji: string
  code: string
  activeBots: number
  totalBots: number
  foundToday: number
  successRate: number
  categories: string[]
  status: 'active' | 'partial' | 'inactive'
  lastScan: string
  cities: string[]
}

const MOCK_COUNTRIES: Country[] = [
  {
    id: 1,
    name: 'İtalya',
    emoji: '🇮🇹',
    code: 'IT',
    activeBots: 2,
    totalBots: 2,
    foundToday: 8,
    successRate: 85,
    categories: ['Schengen', 'Aile', 'Öğrenci'],
    status: 'active',
    lastScan: '1 dk önce',
    cities: ['Roma', 'Milano', 'Floransa'],
  },
  {
    id: 2,
    name: 'Hollanda',
    emoji: '🇳🇱',
    code: 'NL',
    activeBots: 1,
    totalBots: 2,
    foundToday: 1,
    successRate: 74,
    categories: ['Schengen', 'İş'],
    status: 'partial',
    lastScan: '5 dk önce',
    cities: ['Amsterdam', 'Rotterdam'],
  },
  {
    id: 3,
    name: 'Almanya',
    emoji: '🇩🇪',
    code: 'DE',
    activeBots: 0,
    totalBots: 1,
    foundToday: 0,
    successRate: 0,
    categories: ['Schengen', 'Çalışma'],
    status: 'inactive',
    lastScan: '23 dk önce',
    cities: ['Berlin', 'Münih', 'Frankfurt'],
  },
  {
    id: 4,
    name: 'Fransa',
    emoji: '🇫🇷',
    code: 'FR',
    activeBots: 0,
    totalBots: 1,
    foundToday: 0,
    successRate: 0,
    categories: ['Schengen'],
    status: 'inactive',
    lastScan: '1 sa önce',
    cities: ['Paris', 'Lyon'],
  },
]

const statusConfig = {
  active: { label: 'Aktif', variant: 'success' as const },
  partial: { label: 'Kısmi', variant: 'warning' as const },
  inactive: { label: 'Pasif', variant: 'default' as const },
}

export default function CountriesPage() {
  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'İzlenen Ülke', value: MOCK_COUNTRIES.length, icon: Globe, color: 'text-violet-600 bg-violet-50' },
          { label: 'Aktif Bot', value: MOCK_COUNTRIES.reduce((s, c) => s + c.activeBots, 0), icon: Bot, color: 'text-blue-600 bg-blue-50' },
          { label: 'Bugün Bulunan', value: MOCK_COUNTRIES.reduce((s, c) => s + c.foundToday, 0), icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Ort. Başarı', value: `%${Math.round(MOCK_COUNTRIES.filter(c => c.successRate > 0).reduce((s, c) => s + c.successRate, 0) / MOCK_COUNTRIES.filter(c => c.successRate > 0).length || 0)}`, icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ülke kartları */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">İzlenen Ülkeler</h2>
        <Button size="sm">
          <Plus className="w-3 h-3" />
          Ülke Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_COUNTRIES.map((country) => {
          const statusInfo = statusConfig[country.status]
          return (
            <div
              key={country.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              {/* Başlık */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl border border-slate-100">
                    {country.emoji}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{country.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{country.cities.join(' · ')}</p>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
              </div>

              {/* Vize kategorileri */}
              <div className="flex gap-1.5 flex-wrap mb-4">
                {country.categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Metrikler */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-slate-50 rounded-lg p-2.5">
                  <p className="text-base font-bold text-blue-600">{country.activeBots}/{country.totalBots}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bot</p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg p-2.5">
                  <p className="text-base font-bold text-emerald-600">{country.foundToday}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bugün</p>
                </div>
                <div className="text-center bg-slate-50 rounded-lg p-2.5">
                  <p className="text-base font-bold text-slate-800">%{country.successRate}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Başarı</p>
                </div>
              </div>

              {/* Alt bilgi */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">Son tarama: {country.lastScan}</span>
                <Button variant="outline" size="sm">Detay</Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
