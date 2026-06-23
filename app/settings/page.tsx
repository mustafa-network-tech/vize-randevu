'use client'

import { useState } from 'react'
import { cn } from '@/lib/helpers/cn'
import { Button } from '@/components/ui/Button'
import {
  Settings, Bot, Shield, Bell, Clock, Globe, Download,
  Sun, Moon, Lock, Key, Database, AlertTriangle, CheckCircle2,
} from 'lucide-react'

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch" aria-checked={checked} onClick={onChange}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  )
}

function SectionCard({ icon: Icon, title, desc, children }: {
  icon: typeof Settings; title: string; desc: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {children}
      </div>
    </div>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</p>
        {desc && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function InputField({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  const [val, setVal] = useState(value)
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">{label}</label>
      <input
        type={type} value={val} onChange={e => setVal(e.target.value)}
        className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

function SelectField({ label, value, options }: { label: string; value: string; options: string[] }) {
  const [val, setVal] = useState(value)
  return (
    <div>
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">{label}</label>
      <select
        value={val} onChange={e => setVal(e.target.value)}
        className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function SettingsPage() {
  const [toggles, setToggles] = useState({
    maintenanceMode: false, debugLogs: false, autoRestart: true,
    proxyRotation: true, captchaFallback: true, headless: true,
    twoFactor: false, ipWhitelist: false,
    emailNotifs: true, slotAlert: true, errorAlert: true,
  })

  const toggle = (k: keyof typeof toggles) =>
    setToggles(prev => ({ ...prev, [k]: !prev[k] }))

  const [saved, setSaved] = useState(false)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Kayıt bandı */}
      {saved && (
        <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Ayarlar başarıyla kaydedildi.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Genel Ayarlar */}
        <SectionCard icon={Settings} title="Genel Ayarlar" desc="Temel sistem yapılandırması">
          <InputField label="Sistem Adı" value="Vize Randevu Paneli" />
          <InputField label="Yönetici E-posta" value="admin@vizerandevu.com" type="email" />
          <SettingRow label="Bakım Modu" desc="Sistemi geçici olarak kapat">
            <Toggle checked={toggles.maintenanceMode} onChange={() => toggle('maintenanceMode')} />
          </SettingRow>
          <SettingRow label="Hata Ayıklama Logları" desc="Detaylı sistem loglarını etkinleştir">
            <Toggle checked={toggles.debugLogs} onChange={() => toggle('debugLogs')} />
          </SettingRow>
        </SectionCard>

        {/* Bot Ayarları */}
        <SectionCard icon={Bot} title="Bot Ayarları" desc="VFS bot davranış parametreleri">
          <InputField label="Varsayılan Tarama Aralığı (sn)" value="45" type="number" />
          <InputField label="Maks. Günlük Deneme" value="2500" type="number" />
          <SettingRow label="Otomatik Yeniden Başlatma" desc="Hata sonrası botu otomatik başlat">
            <Toggle checked={toggles.autoRestart} onChange={() => toggle('autoRestart')} />
          </SettingRow>
          <SettingRow label="Headless Mod" desc="Tarayıcıyı arka planda çalıştır">
            <Toggle checked={toggles.headless} onChange={() => toggle('headless')} />
          </SettingRow>
        </SectionCard>

        {/* Proxy Ayarları */}
        <SectionCard icon={Shield} title="Proxy Ayarları" desc="IP havuzu ve rotasyon ayarları">
          <SelectField label="Proxy Sağlayıcı" value="BrightData" options={['BrightData', 'Oxylabs', 'Smartproxy', 'Manuel']} />
          <InputField label="Maks. Ping Eşiği (ms)" value="500" type="number" />
          <SettingRow label="Otomatik Rotasyon" desc="Yavaş proxy'yi otomatik değiştir">
            <Toggle checked={toggles.proxyRotation} onChange={() => toggle('proxyRotation')} />
          </SettingRow>
          <SettingRow label="CAPTCHA Sonrası Değiştir" desc="CAPTCHA alındıktan sonra IP değiştir">
            <Toggle checked={toggles.captchaFallback} onChange={() => toggle('captchaFallback')} />
          </SettingRow>
        </SectionCard>

        {/* Bildirim Ayarları */}
        <SectionCard icon={Bell} title="Bildirim Ayarları" desc="Uyarı ve bildirim tercihleri">
          <SettingRow label="E-posta Bildirimleri" desc="Kritik olaylar için e-posta gönder">
            <Toggle checked={toggles.emailNotifs} onChange={() => toggle('emailNotifs')} />
          </SettingRow>
          <SettingRow label="Slot Bulundu Uyarısı" desc="Yeni randevu slotu bulunduğunda">
            <Toggle checked={toggles.slotAlert} onChange={() => toggle('slotAlert')} />
          </SettingRow>
          <SettingRow label="Hata Uyarısı" desc="Bot veya proxy hatalarında bildirim">
            <Toggle checked={toggles.errorAlert} onChange={() => toggle('errorAlert')} />
          </SettingRow>
          <InputField label="Bildirim E-posta Adresi" value="alerts@vizerandevu.com" type="email" />
        </SectionCard>

        {/* Güvenlik */}
        <SectionCard icon={Lock} title="Güvenlik" desc="Kimlik doğrulama ve erişim kontrolü">
          <SettingRow label="İki Faktörlü Doğrulama" desc="Admin hesapları için 2FA zorunlu kıl">
            <Toggle checked={toggles.twoFactor} onChange={() => toggle('twoFactor')} />
          </SettingRow>
          <SettingRow label="IP Kısıtlaması" desc="Yalnızca izin verilen IP'lerden erişime izin ver">
            <Toggle checked={toggles.ipWhitelist} onChange={() => toggle('ipWhitelist')} />
          </SettingRow>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">İzin Verilen IP'ler</label>
            <textarea
              rows={3}
              defaultValue="192.168.1.0/24&#10;10.0.0.1"
              disabled={!toggles.ipWhitelist}
              className="w-full text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <Button variant="outline" size="sm">
            <Key className="w-3 h-3" />API Anahtarlarını Yönet
          </Button>
        </SectionCard>

        {/* Oturum & Tema */}
        <div className="space-y-5">
          <SectionCard icon={Clock} title="Oturum Süresi" desc="Otomatik oturum kapatma ayarları">
            <SelectField
              label="Oturum Zaman Aşımı"
              value="8 saat"
              options={['30 dakika', '1 saat', '4 saat', '8 saat', '24 saat', 'Sınırsız']}
            />
            <SettingRow label="Hareketsizlik Tespiti" desc="Kullanıcı hareketsizse otomatik çıkış">
              <Toggle checked={true} onChange={() => {}} />
            </SettingRow>
          </SectionCard>

          <SectionCard icon={Sun} title="Tema & Dil" desc="Görünüm ve lokalizasyon tercihleri">
            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-blue-500 rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer">
                <Sun className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Açık</span>
              </div>
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                <Moon className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-medium text-slate-500">Koyu</span>
              </div>
            </div>
            <SelectField label="Dil" value="Türkçe" options={['Türkçe', 'English', 'Deutsch', 'Français']} />
            <SelectField label="Zaman Dilimi" value="UTC+3 (İstanbul)" options={['UTC+0', 'UTC+1', 'UTC+2', 'UTC+3 (İstanbul)']} />
          </SectionCard>
        </div>
      </div>

      {/* Yedekleme */}
      <SectionCard icon={Database} title="Yedekleme & Geri Yükleme" desc="Sistem verisi yedekleme ve geri yükleme işlemleri">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Son Tam Yedek',   value: '22 Haz 2026 03:00', icon: Database },
            { label: 'Yedek Boyutu',    value: '142 MB',            icon: Download },
            { label: 'Otomatik Yedek',  value: 'Her Gece 03:00',    icon: Clock    },
          ].map(item => (
            <div key={item.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 flex items-center gap-3">
              <item.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm"><Download className="w-3 h-3" />Manuel Yedek Al</Button>
          <Button variant="outline" size="sm"><Database className="w-3 h-3" />Geri Yükle</Button>
          <div className="ml-auto flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Geri yükleme mevcut verilerin üzerine yazar.
          </div>
        </div>
      </SectionCard>

      {/* Kaydet butonu */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">Son güncelleme: 22 Haz 2026 — 21:15</p>
        <div className="flex gap-3">
          <Button variant="outline">Sıfırla</Button>
          <Button onClick={handleSave}>Tüm Ayarları Kaydet</Button>
        </div>
      </div>
    </div>
  )
}
