import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CalendarCheck, Clock, MapPin, User, Filter, Download } from 'lucide-react'

interface Appointment {
  id: number
  applicantName: string
  country: string
  countryEmoji: string
  city: string
  visaType: string
  date: string
  time: string
  status: 'found' | 'booked' | 'missed' | 'completed'
  foundBy: string
  foundAt: string
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 1,
    applicantName: 'Seda Özer',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    city: 'Roma',
    visaType: 'Schengen',
    date: '18 Temmuz 2026',
    time: '09:30',
    status: 'booked',
    foundBy: 'İtalya Bot #1',
    foundAt: '22:35',
  },
  {
    id: 2,
    applicantName: 'İtalya Bot #2',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    city: 'Milano',
    visaType: 'Schengen',
    date: '15 Ağustos 2026',
    time: '10:30',
    status: 'found',
    foundBy: 'İtalya Bot #2',
    foundAt: '22:43',
  },
  {
    id: 3,
    applicantName: 'Akif Can',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    city: 'Roma',
    visaType: 'Schengen',
    date: '22 Temmuz 2026',
    time: '11:00',
    status: 'completed',
    foundBy: 'İtalya Bot #1',
    foundAt: '20:10',
  },
  {
    id: 4,
    applicantName: 'Selma İdiz',
    country: 'Hollanda',
    countryEmoji: '🇳🇱',
    city: 'Amsterdam',
    visaType: 'Schengen',
    date: '25 Temmuz 2026',
    time: '14:00',
    status: 'found',
    foundBy: 'Hollanda Bot #1',
    foundAt: '21:55',
  },
  {
    id: 5,
    applicantName: 'Hüseyin Demir',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    city: 'Floransa',
    visaType: 'Schengen',
    date: '10 Temmuz 2026',
    time: '10:00',
    status: 'missed',
    foundBy: 'İtalya Bot #2',
    foundAt: '18:30',
  },
  {
    id: 6,
    applicantName: 'Filiz Yiğit',
    country: 'İtalya',
    countryEmoji: '🇮🇹',
    city: 'Milano',
    visaType: 'Öğrenci',
    date: '01 Ağustos 2026',
    time: '09:00',
    status: 'booked',
    foundBy: 'İtalya Bot #2',
    foundAt: '22:40',
  },
]

const statusConfig: Record<Appointment['status'], { label: string; variant: BadgeVariant }> = {
  found: { label: 'Bulundu', variant: 'info' },
  booked: { label: 'Rezerve Edildi', variant: 'success' },
  missed: { label: 'Kaçırıldı', variant: 'error' },
  completed: { label: 'Tamamlandı', variant: 'success' },
}

const counts = {
  found: MOCK_APPOINTMENTS.filter((a) => a.status === 'found').length,
  booked: MOCK_APPOINTMENTS.filter((a) => a.status === 'booked').length,
  completed: MOCK_APPOINTMENTS.filter((a) => a.status === 'completed').length,
  missed: MOCK_APPOINTMENTS.filter((a) => a.status === 'missed').length,
}

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Yeni Bulunan', value: counts.found, icon: CalendarCheck, color: 'bg-blue-50 text-blue-600' },
          { label: 'Rezerve Edildi', value: counts.booked, icon: CalendarCheck, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Tamamlandı', value: counts.completed, icon: CalendarCheck, color: 'bg-violet-50 text-violet-600' },
          { label: 'Kaçırıldı', value: counts.missed, icon: Clock, color: 'bg-red-50 text-red-500' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Randevu Listesi</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-3 h-3" />
              Filtre
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="w-3 h-3" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-5">Başvuru Sahibi</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Ülke / Şehir</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Randevu Tarihi</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Vize Türü</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Durum</th>
                <th className="text-left text-xs font-semibold text-slate-500 py-3 px-4">Bulan Bot</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_APPOINTMENTS.map((appt) => {
                const statusInfo = statusConfig[appt.status]
                return (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{appt.applicantName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span>{appt.countryEmoji}</span>
                        <span className="text-sm text-slate-700">{appt.country}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{appt.city}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium text-slate-800">{appt.date}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{appt.time}</p>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-600">{appt.visaType}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={statusInfo.variant} dot>{statusInfo.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-xs text-slate-600">{appt.foundBy}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{appt.foundAt}</p>
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
