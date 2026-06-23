import { LogTable, LogEntry } from '@/components/logs/LogTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Download, Filter, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react'

const MOCK_LOGS: LogEntry[] = [
  { id: 1, timestamp: '22:43:12', level: 'success', bot: 'İtalya Bot #2', country: 'İtalya', message: 'Milano ofisinde 15 Ağustos 10:30 slotu bulundu ve rezerve edildi' },
  { id: 2, timestamp: '22:41:05', level: 'info', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Oturum yenilendi, Amsterdam taraması devam ediyor' },
  { id: 3, timestamp: '22:38:47', level: 'error', bot: 'Almanya Bot #1', country: 'Almanya', message: 'Bağlantı zaman aşımı: VFS Germany sunucusu 30 saniyedir yanıt vermiyor' },
  { id: 4, timestamp: '22:38:02', level: 'warning', bot: 'Almanya Bot #1', country: 'Almanya', message: 'VFS Germany yavaş yanıt veriyor, yeniden deneniyor (3/5)' },
  { id: 5, timestamp: '22:35:20', level: 'success', bot: 'İtalya Bot #1', country: 'İtalya', message: 'Roma ofisinde 18 Temmuz 09:30 randevusu alındı - Seda Özer' },
  { id: 6, timestamp: '22:30:11', level: 'warning', bot: 'İtalya Bot #1', country: 'İtalya', message: 'Rate limit yaklaşıyor, 60 saniye bekleniyor' },
  { id: 7, timestamp: '22:28:44', level: 'info', bot: 'İtalya Bot #2', country: 'İtalya', message: 'Milano sayfası yüklendi, müsait slotlar kontrol ediliyor' },
  { id: 8, timestamp: '22:25:33', level: 'info', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Oturum başlatıldı, proxy IP: 185.220.101.xx' },
  { id: 9, timestamp: '22:20:05', level: 'success', bot: 'İtalya Bot #2', country: 'İtalya', message: 'Floransa ofisinde slot bulundu: 10 Temmuz 10:00 - Pelin Köşker için rezerve edildi' },
  { id: 10, timestamp: '22:15:18', level: 'error', bot: 'Almanya Bot #1', country: 'Almanya', message: 'CAPTCHA çözümü başarısız, yeniden deneniyor' },
  { id: 11, timestamp: '22:10:42', level: 'info', bot: 'İtalya Bot #1', country: 'İtalya', message: 'Roma vizesi sayfası taranıyor: 24 slot kontrol edildi' },
  { id: 12, timestamp: '22:05:30', level: 'warning', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Proxy rotasyonu yapılıyor (eski IP bloke edildi)' },
  { id: 13, timestamp: '22:00:00', level: 'info', bot: 'İtalya Bot #2', country: 'İtalya', message: 'Günlük tarama başlatıldı, hedef: Milano, Roma, Floransa' },
  { id: 14, timestamp: '21:55:14', level: 'success', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Amsterdam - 25 Temmuz 14:00 slotu bulundu - Selma İdiz' },
  { id: 15, timestamp: '21:50:22', level: 'info', bot: 'İtalya Bot #1', country: 'İtalya', message: 'VFS Italy oturum doğrulaması tamamlandı' },
]

const levelCounts = {
  total: MOCK_LOGS.length,
  error: MOCK_LOGS.filter((l) => l.level === 'error').length,
  warning: MOCK_LOGS.filter((l) => l.level === 'warning').length,
  success: MOCK_LOGS.filter((l) => l.level === 'success').length,
  info: MOCK_LOGS.filter((l) => l.level === 'info').length,
}

export default function LogsPage() {
  return (
    <div className="space-y-6">
      {/* Özet bantları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hata', value: levelCounts.error, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
          { label: 'Uyarı', value: levelCounts.warning, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Başarı', value: levelCounts.success, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Bilgi', value: levelCounts.info, icon: Info, color: 'text-blue-600 bg-blue-50' },
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
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Sistem Logları</h3>
            <Badge variant="default">{levelCounts.total} kayıt</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {(['Tümü', 'Hata', 'Uyarı', 'Başarı', 'Bilgi'] as const).map((f, i) => (
                <button
                  key={f}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    i === 0
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="sm">
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="sm">
              <Download className="w-3 h-3" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        <LogTable logs={MOCK_LOGS} compact={false} />

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{levelCounts.total} log gösteriliyor</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Önceki</Button>
            <Button variant="outline" size="sm" disabled>Sonraki</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
