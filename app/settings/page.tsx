import { Button } from '@/components/ui/Button'
import { Bell, Bot, Globe, Lock, Save, Zap, Clock } from 'lucide-react'

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <div className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${defaultChecked ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${defaultChecked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </div>
  )
}

function SectionHeader({ icon: Icon, title, description }: { icon: typeof Bell; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="w-4.5 h-4.5 text-slate-600" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Genel Ayarlar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Zap} title="Genel Ayarlar" description="Sistem genelinde geçerli temel yapılandırma" />
        <div className="mt-4">
          <SettingRow
            label="Sistem Adı"
            description="Panelde görünen sistem başlığı"
          >
            <input
              defaultValue="Vize Randevu Sistemi"
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              readOnly
            />
          </SettingRow>
          <SettingRow
            label="Zaman Dilimi"
            description="Tüm zaman damgaları bu dilime göre gösterilir"
          >
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48">
              <option>Europe/Istanbul (UTC+3)</option>
              <option>UTC</option>
            </select>
          </SettingRow>
          <SettingRow
            label="Dil"
            description="Arayüz dili"
          >
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48">
              <option>Türkçe</option>
              <option>English</option>
            </select>
          </SettingRow>
        </div>
      </div>

      {/* Bot Ayarları */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Bot} title="Bot Ayarları" description="Otomasyon botlarının davranış parametreleri" />
        <div className="mt-4">
          <SettingRow
            label="Tarama Aralığı"
            description="Her bot iterasyonu arasındaki bekleme süresi (saniye)"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={45}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-center"
                readOnly
              />
              <span className="text-xs text-slate-500">saniye</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Maksimum Yeniden Deneme"
            description="Hata durumunda bağlantı yeniden deneme sayısı"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={5}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-center"
                readOnly
              />
              <span className="text-xs text-slate-500">deneme</span>
            </div>
          </SettingRow>
          <SettingRow
            label="Çalışma Saatleri"
            description="Botların aktif olacağı zaman aralığı"
          >
            <div className="flex items-center gap-2">
              <input
                type="time"
                defaultValue="07:00"
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
              <span className="text-xs text-slate-400">—</span>
              <input
                type="time"
                defaultValue="23:00"
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>
          </SettingRow>
          <SettingRow
            label="Otomatik Yeniden Başlatma"
            description="Hata durumunda botu otomatik olarak yeniden başlat"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow
            label="Ekran Görüntüsü Al"
            description="Her işlem sonrası ekran görüntüsü kaydet"
          >
            <Toggle defaultChecked={false} />
          </SettingRow>
        </div>
      </div>

      {/* Bildirim Ayarları */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Bell} title="Bildirimler" description="Randevu bulunduğunda ve sistem olaylarında uyarı al" />
        <div className="mt-4">
          <SettingRow
            label="Telegram Bildirimleri"
            description="Randevu bulunduğunda Telegram mesajı gönder"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow
            label="Telegram Bot Token"
            description=""
          >
            <input
              type="password"
              defaultValue="••••••••••••••••••••"
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 font-mono"
              readOnly
            />
          </SettingRow>
          <SettingRow
            label="E-posta Bildirimleri"
            description="Kritik hatalar için e-posta bildirimi al"
          >
            <Toggle defaultChecked={false} />
          </SettingRow>
          <SettingRow
            label="Ses Bildirimi"
            description="Randevu bulunduğunda tarayıcıda ses çıkar"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
        </div>
      </div>

      {/* Proxy & Güvenlik */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Globe} title="Proxy Ayarları" description="IP rotasyonu ve bağlantı yapılandırması" />
        <div className="mt-4">
          <SettingRow
            label="Proxy Rotasyonu"
            description="Her oturumda farklı proxy IP adresi kullan"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow
            label="Proxy Sağlayıcı"
            description="Kullanılacak proxy servisi"
          >
            <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48">
              <option>BrightData</option>
              <option>Oxylabs</option>
              <option>Özel Proxy</option>
            </select>
          </SettingRow>
          <SettingRow
            label="User-Agent Rotasyonu"
            description="Her istekte farklı tarayıcı kimliği kullan"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
        </div>
      </div>

      {/* Güvenlik */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Lock} title="Güvenlik" description="Şifreleme ve erişim kontrol ayarları" />
        <div className="mt-4">
          <SettingRow
            label="İki Faktörlü Doğrulama"
            description="Admin girişinde 2FA kullan"
          >
            <Toggle defaultChecked={true} />
          </SettingRow>
          <SettingRow
            label="Oturum Zaman Aşımı"
            description="Hareketsizlik sonrası otomatik çıkış süresi"
          >
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={60}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 text-center"
                readOnly
              />
              <span className="text-xs text-slate-500">dakika</span>
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Log Ayarları */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <SectionHeader icon={Clock} title="Log Yönetimi" description="Sistem kayıtlarının saklanma ve temizlenme politikası" />
        <div className="mt-4">
          <SettingRow
            label="Log Saklama Süresi"
            description="Kayıtların silinmeden önce tutulacağı süre"
          >
            <div className="flex items-center gap-2">
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option>30 gün</option>
                <option>60 gün</option>
                <option>90 gün</option>
              </select>
            </div>
          </SettingRow>
          <SettingRow
            label="Detaylı Loglama"
            description="HTTP istekleri ve yanıtları kaydet (daha fazla disk alanı kullanır)"
          >
            <Toggle defaultChecked={false} />
          </SettingRow>
        </div>
      </div>

      {/* Kaydet */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Sıfırla</Button>
        <Button>
          <Save className="w-4 h-4" />
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  )
}
