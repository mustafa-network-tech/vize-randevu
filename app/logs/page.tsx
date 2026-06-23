import { LogTable, LogEntry } from '@/components/logs/LogTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Download, Filter, RefreshCw, AlertTriangle, CheckCircle, Info, Activity } from 'lucide-react'
import { cn } from '@/lib/helpers/cn'

/* ── 30+ log girişi ────────────────────────────────────────── */

const MOCK_LOGS: LogEntry[] = [
  // 22:40–22:50 bloğu
  { id:  1, timestamp: '22:47:03', level: 'info',    bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Venedik ofisi kontrol edildi — 0 müsait slot' },
  { id:  2, timestamp: '22:45:31', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Roma sayfası yüklendi, 38 slot tarandı' },
  { id:  3, timestamp: '22:43:12', level: 'success', bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Milano — 15 Ağustos 10:30 slotu rezerve edildi (Akif Can)' },
  { id:  4, timestamp: '22:41:58', level: 'info',    bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Amsterdam sayfası yüklendi, 14 slot tarandı' },
  { id:  5, timestamp: '22:41:05', level: 'info',    bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Oturum yenilendi, tarama devam ediyor' },
  // 22:30–22:40 bloğu
  { id:  6, timestamp: '22:38:47', level: 'error',   bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'Bağlantı zaman aşımı: VFS Germany sunucusu 30s yanıt vermiyor' },
  { id:  7, timestamp: '22:38:02', level: 'warning', bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'VFS Germany yavaş yanıt — yeniden deneniyor (3/5)' },
  { id:  8, timestamp: '22:36:44', level: 'info',    bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Milano sayfası yüklendi, müsait slotlar kontrol ediliyor' },
  { id:  9, timestamp: '22:35:20', level: 'success', bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Roma — 18 Temmuz 09:30 randevusu alındı (Seda Özer)' },
  { id: 10, timestamp: '22:33:15', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Floransa ofisi kontrol edildi — 0 müsait slot' },
  { id: 11, timestamp: '22:30:11', level: 'warning', bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Rate limit yaklaşıyor (480/500), 60 saniye bekleniyor' },
  // 22:20–22:30 bloğu
  { id: 12, timestamp: '22:28:44', level: 'info',    bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Milano sayfası yüklendi (sayfa 2/3), müsait slotlar aranıyor' },
  { id: 13, timestamp: '22:26:09', level: 'info',    bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Oturum başlatıldı, proxy IP: 185.220.101.xx atandı' },
  { id: 14, timestamp: '22:25:33', level: 'info',    bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Proxy rotasyonu tamamlandı — yeni IP aktif' },
  { id: 15, timestamp: '22:22:47', level: 'error',   bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'CAPTCHA çözümü başarısız — 90 saniye bekleniyor' },
  { id: 16, timestamp: '22:20:05', level: 'success', bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Floransa — 10 Temmuz 10:00 slotu bulundu (Pelin Köşker)' },
  // 22:10–22:20 bloğu
  { id: 17, timestamp: '22:18:33', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Roma vizesi sayfası taranıyor: 24 slot kontrol edildi' },
  { id: 18, timestamp: '22:15:18', level: 'error',   bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'CAPTCHA çözümü başarısız (1. deneme), yeniden deneniyor' },
  { id: 19, timestamp: '22:13:50', level: 'warning', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Proxy IP bloke edildi — rotasyon başlatılıyor' },
  { id: 20, timestamp: '22:10:42', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'VFS Italy oturumu doğrulandı, tarama devam ediyor' },
  // 22:00–22:10 bloğu
  { id: 21, timestamp: '22:08:14', level: 'info',    bot: 'Hollanda Bot #2', country: 'Hollanda', message: 'Rotterdam — slot taraması başlatıldı' },
  { id: 22, timestamp: '22:06:02', level: 'warning', bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'VFS Germany yüklenme süresi 12s aştı — yavaş bağlantı' },
  { id: 23, timestamp: '22:05:30', level: 'warning', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Proxy rotasyonu yapılıyor — eski IP kara listeye alındı' },
  { id: 24, timestamp: '22:01:45', level: 'info',    bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Günlük tarama başlatıldı: Milano · Roma · Floransa · Venedik' },
  { id: 25, timestamp: '22:00:00', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'Bot başlatıldı — hedef: Roma, Floransa' },
  // 21:50–22:00 bloğu
  { id: 26, timestamp: '21:58:22', level: 'info',    bot: 'Almanya Bot #1',  country: 'Almanya',  message: 'VFS Germany oturum açma tamamlandı' },
  { id: 27, timestamp: '21:55:14', level: 'success', bot: 'Hollanda Bot #1', country: 'Hollanda', message: 'Amsterdam — 25 Temmuz 14:00 slotu bulundu (Selma İdiz)' },
  { id: 28, timestamp: '21:52:08', level: 'info',    bot: 'İtalya Bot #2',   country: 'İtalya',   message: 'Floransa sayfası yüklendi, slot sayısı: 0' },
  { id: 29, timestamp: '21:50:22', level: 'info',    bot: 'İtalya Bot #1',   country: 'İtalya',   message: 'VFS Italy oturum doğrulaması tamamlandı' },
  { id: 30, timestamp: '21:48:00', level: 'info',    bot: 'Hollanda Bot #2', country: 'Hollanda', message: 'Rotterdam oturumu açıldı, slot kontrol ediliyor' },
]

/* ── Saatlik aktivite verisi (bar chart) ─────────────────── */

const HOURLY = [
  { hour: '18', count: 4  },
  { hour: '19', count: 7  },
  { hour: '20', count: 11 },
  { hour: '21', count: 9  },
  { hour: '22', count: 18 },
  { hour: '23', count: 3  },
]
const HOURLY_MAX = Math.max(...HOURLY.map(h => h.count))

/* ── Zaman dilimi grupları ───────────────────────────────── */

const TIME_GROUPS = [
  { label: '22:40 – 22:47', range: [1,  5]  },
  { label: '22:30 – 22:38', range: [6,  11] },
  { label: '22:20 – 22:28', range: [12, 16] },
  { label: '22:10 – 22:18', range: [17, 20] },
  { label: '22:00 – 22:08', range: [21, 25] },
  { label: '21:48 – 21:58', range: [26, 30] },
]

const levelCounts = {
  total:   MOCK_LOGS.length,
  error:   MOCK_LOGS.filter(l => l.level === 'error').length,
  warning: MOCK_LOGS.filter(l => l.level === 'warning').length,
  success: MOCK_LOGS.filter(l => l.level === 'success').length,
  info:    MOCK_LOGS.filter(l => l.level === 'info').length,
}

/* ── Sayfa ─────────────────────────────────────────────────── */

export default function LogsPage() {
  return (
    <div className="space-y-6">

      {/* ── Üst KPI kartları ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Hata',    value: levelCounts.error,   icon: AlertTriangle, color: 'text-red-600 bg-red-50',      pct: Math.round(levelCounts.error   / levelCounts.total * 100) },
          { label: 'Uyarı',   value: levelCounts.warning, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50',  pct: Math.round(levelCounts.warning / levelCounts.total * 100) },
          { label: 'Başarı',  value: levelCounts.success, icon: CheckCircle,   color: 'text-emerald-600 bg-emerald-50', pct: Math.round(levelCounts.success / levelCounts.total * 100) },
          { label: 'Bilgi',   value: levelCounts.info,    icon: Info,          color: 'text-blue-600 bg-blue-50',    pct: Math.round(levelCounts.info    / levelCounts.total * 100) },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', item.color)}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1">
              <div
                className={cn(
                  'h-1 rounded-full',
                  item.label === 'Hata'   ? 'bg-red-500'     :
                  item.label === 'Uyarı'  ? 'bg-amber-500'   :
                  item.label === 'Başarı' ? 'bg-emerald-500' : 'bg-blue-500'
                )}
                style={{ width: `${item.pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">%{item.pct} oranı</p>
          </div>
        ))}
      </div>

      {/* ── Saatlik aktivite grafiği + Özet ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Saatlik bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Saatlik Log Aktivitesi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bugün saat bazlı log yoğunluğu</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Aktif Tarama</span>
            </div>
          </div>

          <div className="flex items-end gap-3 h-28 mb-2">
            {HOURLY.map(h => {
              const pct = Math.round((h.count / HOURLY_MAX) * 100)
              const isActive = h.hour === '22'
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <span className="text-xs font-semibold text-slate-600">{h.count}</span>
                  <div
                    className={cn(
                      'w-full rounded-t-lg transition-all',
                      isActive ? 'bg-blue-600' : 'bg-blue-200'
                    )}
                    style={{ height: `${pct}%` }}
                  />
                  <span className={cn('text-xs font-medium', isActive ? 'text-blue-600' : 'text-slate-400')}>
                    {h.hour}:00
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 text-center">Koyu bar = mevcut saat</p>
        </div>

        {/* Bot bazlı log dağılımı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Bot Bazlı Dağılım</h3>
          <div className="space-y-3">
            {[
              { name: 'İtalya Bot #2',   emoji: '🇮🇹', count: MOCK_LOGS.filter(l => l.bot === 'İtalya Bot #2').length   },
              { name: 'İtalya Bot #1',   emoji: '🇮🇹', count: MOCK_LOGS.filter(l => l.bot === 'İtalya Bot #1').length   },
              { name: 'Almanya Bot #1',  emoji: '🇩🇪', count: MOCK_LOGS.filter(l => l.bot === 'Almanya Bot #1').length  },
              { name: 'Hollanda Bot #1', emoji: '🇳🇱', count: MOCK_LOGS.filter(l => l.bot === 'Hollanda Bot #1').length },
              { name: 'Hollanda Bot #2', emoji: '🇳🇱', count: MOCK_LOGS.filter(l => l.bot === 'Hollanda Bot #2').length },
            ].sort((a, b) => b.count - a.count).map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-700 flex items-center gap-1.5">
                    <span>{item.emoji}</span>
                    <span className="font-medium">{item.name}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-600">{item.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-blue-400 rounded-full"
                    style={{ width: `${(item.count / MOCK_LOGS.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-slate-800">{levelCounts.total}</p>
              <p className="text-xs text-slate-500">Toplam Log</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{levelCounts.success}</p>
              <p className="text-xs text-slate-500">Başarı</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Log tablosu — zaman dilimi gruplarıyla ───────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Sistem Logları</h3>
            <Badge variant="default">{levelCounts.total} kayıt</Badge>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-slate-400">Canlı güncelleniyor</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 flex-wrap">
              {(['Tümü', 'Hata', 'Uyarı', 'Başarı', 'Bilgi'] as const).map((f, i) => (
                <button key={f} className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                  i === 0
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}>
                  {f}
                  {i > 0 && (
                    <span className="ml-1 opacity-60">
                      ({[0, levelCounts.error, levelCounts.warning, levelCounts.success, levelCounts.info][i]})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <Button variant="outline"    size="sm"><Filter    className="w-3 h-3" /></Button>
            <Button variant="secondary"  size="sm"><RefreshCw className="w-3 h-3" /></Button>
            <Button variant="secondary"  size="sm"><Download  className="w-3 h-3" />Dışa Aktar</Button>
          </div>
        </div>

        {/* Zaman dilimi gruplarıyla loglar */}
        {TIME_GROUPS.map(group => {
          const groupLogs = MOCK_LOGS.filter(l => l.id >= group.range[0] && l.id <= group.range[1])
          const hasError  = groupLogs.some(l => l.level === 'error')
          const hasSuccess = groupLogs.some(l => l.level === 'success')
          return (
            <div key={group.label}>
              {/* Zaman ayırıcı */}
              <div className={cn(
                'flex items-center gap-3 px-5 py-2 border-y text-xs font-semibold',
                hasError   ? 'bg-red-50/40 border-red-100 text-red-600'     :
                hasSuccess ? 'bg-emerald-50/40 border-emerald-100 text-emerald-700' :
                'bg-slate-50 border-slate-100 text-slate-500'
              )}>
                <span>{group.label}</span>
                <span className="font-normal opacity-60">· {groupLogs.length} kayıt</span>
                {hasError   && <Badge variant="error"   className="ml-auto">Hata var</Badge>}
                {hasSuccess && !hasError && <Badge variant="success" className="ml-auto">Başarı</Badge>}
              </div>
              <LogTable logs={groupLogs} compact={false} />
            </div>
          )
        })}

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{levelCounts.total} log gösteriliyor · Gerçek zamanlı takip aktif</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Önceki</Button>
            <Button variant="outline" size="sm" disabled>Sonraki</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
