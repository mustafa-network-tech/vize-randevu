import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Filter } from 'lucide-react'

interface Application {
  id: number
  applicantName: string
  passportNo: string
  country: string
  countryEmoji: string
  visaType: string
  status: 'pending' | 'processing' | 'appointment_found' | 'completed' | 'cancelled'
  submittedAt: string
  appointmentDate?: string
  assignedBot?: string
  notes?: string
}

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 1,
    applicantName: 'Seda Özer',
    passportNo: 'A1234567',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    visaType: 'Schengen',
    status: 'appointment_found',
    submittedAt: '20 Haziran 2026',
    appointmentDate: '18 Temmuz 2026',
    assignedBot: 'İtalya Bot #1',
  },
  {
    id: 2,
    applicantName: 'Akif Can',
    passportNo: 'B2345678',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    visaType: 'Schengen',
    status: 'completed',
    submittedAt: '15 Haziran 2026',
    appointmentDate: '22 Temmuz 2026',
    assignedBot: 'İtalya Bot #2',
  },
  {
    id: 3,
    applicantName: 'Selma İdiz',
    passportNo: 'C3456789',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    visaType: 'Schengen',
    status: 'processing',
    submittedAt: '21 Haziran 2026',
    assignedBot: 'Hollanda Bot #1',
  },
  {
    id: 4,
    applicantName: 'Yeliz Özsoy',
    passportNo: 'D4567890',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    visaType: 'Öğrenci',
    status: 'appointment_found',
    submittedAt: '18 Haziran 2026',
    appointmentDate: '01 Ağustos 2026',
    assignedBot: 'İtalya Bot #2',
  },
  {
    id: 5,
    applicantName: 'Mehmet İnce',
    passportNo: 'E5678901',
    country: 'Almanya',
    countryEmoji: '🇩🇪',
    visaType: 'Schengen',
    status: 'pending',
    submittedAt: '22 Haziran 2026',
    notes: 'Bot şu an hata durumunda, beklemede',
  },
  {
    id: 6,
    applicantName: 'Pelin Köşker',
    passportNo: 'F6789012',
    country: 'Fransa',
    countryEmoji: '🇫🇷',
    visaType: 'Schengen',
    status: 'pending',
    submittedAt: '23 Haziran 2026',
  },
  {
    id: 7,
    applicantName: 'Yılmaz Er',
    passportNo: 'G7890123',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    visaType: 'İş',
    status: 'cancelled',
    submittedAt: '10 Haziran 2026',
    notes: 'Müşteri iptal etti',
  },
]

const statusConfig: Record<Application['status'], { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Beklemede', variant: 'default' },
  processing: { label: 'İşleniyor', variant: 'info' },
  appointment_found: { label: 'Randevu Bulundu', variant: 'success' },
  completed: { label: 'Tamamlandı', variant: 'success' },
  cancelled: { label: 'İptal', variant: 'error' },
}

const statusCounts = {
  all: MOCK_APPLICATIONS.length,
  pending: MOCK_APPLICATIONS.filter((a) => a.status === 'pending').length,
  processing: MOCK_APPLICATIONS.filter((a) => a.status === 'processing').length,
  found: MOCK_APPLICATIONS.filter((a) => a.status === 'appointment_found').length,
  completed: MOCK_APPLICATIONS.filter((a) => a.status === 'completed').length,
}

export default function ApplicationsPage() {
  return (
    <div className="space-y-6">
      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Toplam', value: statusCounts.all, color: 'bg-slate-50 text-slate-800' },
          { label: 'Beklemede', value: statusCounts.pending, color: 'bg-slate-50 text-slate-600' },
          { label: 'İşleniyor', value: statusCounts.processing, color: 'bg-blue-50 text-blue-700' },
          { label: 'Randevu Bulundu', value: statusCounts.found, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Tamamlandı', value: statusCounts.completed, color: 'bg-emerald-50 text-emerald-800' },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 text-center border border-slate-200 ${item.color}`}>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs mt-1 font-medium opacity-70">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Tablo başlık */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Başvurular</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ad veya pasaport ara..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                readOnly
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-3 h-3" />
              Filtre
            </Button>
            <Button size="sm">
              <Plus className="w-3 h-3" />
              Yeni Başvuru
            </Button>
          </div>
        </div>

        {/* Tablo */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Başvuru Sahibi</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Ülke / Vize</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Durum</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Randevu</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Atanan Bot</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Tarih</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_APPLICATIONS.map((app) => {
                const statusInfo = statusConfig[app.status]
                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-medium text-slate-800">{app.applicantName}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{app.passportNo}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm text-slate-700">
                        {app.countryEmoji} {app.country}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{app.visaType}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={statusInfo.variant} dot>
                        {statusInfo.label}
                      </Badge>
                      {app.notes && (
                        <p className="text-xs text-slate-400 mt-1 max-w-xs truncate">{app.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {app.appointmentDate ? (
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                          {app.appointmentDate}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {app.assignedBot ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                      {app.submittedAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <Button variant="ghost" size="sm">Detay</Button>
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
