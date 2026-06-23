import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Users, ShieldCheck, AlertTriangle, XCircle, Plus, Key, RefreshCw } from 'lucide-react'

interface VfsAccount {
  id: number
  username: string
  email: string
  country: string
  countryEmoji: string
  status: 'active' | 'rate_limited' | 'suspended' | 'expired'
  lastUsed: string
  assignedBot?: string
  requestsToday: number
  requestsLimit: number
  notes?: string
}

const MOCK_ACCOUNTS: VfsAccount[] = [
  {
    id: 1,
    username: 'vfs_italy_01',
    email: 'italy01@vizeproxy.com',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    status: 'active',
    lastUsed: '2 dk önce',
    assignedBot: 'İtalya Bot #1',
    requestsToday: 145,
    requestsLimit: 500,
  },
  {
    id: 2,
    username: 'vfs_italy_02',
    email: 'italy02@vizeproxy.com',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    status: 'active',
    lastUsed: '1 dk önce',
    assignedBot: 'İtalya Bot #2',
    requestsToday: 201,
    requestsLimit: 500,
  },
  {
    id: 3,
    username: 'vfs_nl_01',
    email: 'nl01@vizeproxy.com',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    status: 'active',
    lastUsed: '5 dk önce',
    assignedBot: 'Hollanda Bot #1',
    requestsToday: 89,
    requestsLimit: 300,
  },
  {
    id: 4,
    username: 'vfs_nl_02',
    email: 'nl02@vizeproxy.com',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    status: 'rate_limited',
    lastUsed: '45 dk önce',
    requestsToday: 312,
    requestsLimit: 300,
    notes: 'Limit aşıldı, 2 saat sonra sıfırlanacak',
  },
  {
    id: 5,
    username: 'vfs_de_01',
    email: 'de01@vizeproxy.com',
    country: 'Almanya',
    countryEmoji: '🇩🇪',
    status: 'suspended',
    lastUsed: '3 gün önce',
    requestsToday: 0,
    requestsLimit: 200,
    notes: 'VFS Germany hesabı geçici askıya alındı',
  },
  {
    id: 6,
    username: 'vfs_fr_01',
    email: 'fr01@vizeproxy.com',
    country: 'Fransa',
    countryEmoji: '🇫🇷',
    status: 'expired',
    lastUsed: '7 gün önce',
    requestsToday: 0,
    requestsLimit: 200,
    notes: 'Şifre süresi doldu, yenilenmesi gerekiyor',
  },
]

const statusConfig: Record<VfsAccount['status'], { label: string; variant: BadgeVariant; icon: typeof ShieldCheck }> = {
  active: { label: 'Aktif', variant: 'success', icon: ShieldCheck },
  rate_limited: { label: 'Limit Aşıldı', variant: 'warning', icon: AlertTriangle },
  suspended: { label: 'Askıya Alındı', variant: 'error', icon: XCircle },
  expired: { label: 'Süresi Doldu', variant: 'error', icon: XCircle },
}

const counts = {
  active: MOCK_ACCOUNTS.filter((a) => a.status === 'active').length,
  issues: MOCK_ACCOUNTS.filter((a) => a.status !== 'active').length,
  total: MOCK_ACCOUNTS.length,
}

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam Hesap', value: counts.total, icon: Users, color: 'bg-slate-50 text-slate-600' },
          { label: 'Aktif Hesap', value: counts.active, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Sorunlu Hesap', value: counts.issues, icon: AlertTriangle, color: 'bg-red-50 text-red-500' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hesap kartları */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">VFS Hesapları</h2>
        <Button size="sm">
          <Plus className="w-3 h-3" />
          Hesap Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_ACCOUNTS.map((account) => {
          const statusInfo = statusConfig[account.status]
          const usagePercent = Math.round((account.requestsToday / account.requestsLimit) * 100)

          return (
            <div
              key={account.id}
              className={`bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow ${
                account.status !== 'active' ? 'border-slate-200 opacity-90' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                    {account.countryEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 font-mono">{account.username}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{account.email}</p>
                  </div>
                </div>
                <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
              </div>

              {account.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-amber-700">{account.notes}</p>
                </div>
              )}

              {/* Kullanım çubuğu */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Günlük Kullanım</span>
                  <span className={`text-xs font-semibold ${usagePercent >= 90 ? 'text-red-600' : usagePercent >= 70 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {account.requestsToday}/{account.requestsLimit}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      usagePercent >= 90
                        ? 'bg-red-500'
                        : usagePercent >= 70
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  {account.assignedBot ? (
                    <p className="text-xs text-slate-600">
                      <span className="text-slate-400">Bot: </span>{account.assignedBot}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Bot atanmadı</p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">Son: {account.lastUsed}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm">
                    <Key className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
