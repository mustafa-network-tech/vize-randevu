# Vize Randevu — Bot Motoru

Next.js panelinden bağımsız çalışan, Supabase üzerinden kontrol edilen bot motoru.

## Mimari

```
┌─────────────────────────────────────────────┐
│           Next.js Panel (Siz)               │
│  /accounts → visa_accounts ekle             │
│  /bots     → bot oluştur, "Başlat" bas      │
│  /logs     → gerçek logları izle            │
│  /appointments → bulunan randevuları gör    │
└────────────────────┬────────────────────────┘
                     │  Supabase (ortak DB)
┌────────────────────▼────────────────────────┐
│           Bot Motoru (Bu klasör)            │
│  Her 5 saniyede status='running' botları    │
│  sorgular → VFS sitesine HTTP isteği atar   │
│  → randevu bulursa appointments tablosuna   │
│    yazar → Telegram bildirimi gönderir      │
└─────────────────────────────────────────────┘
```

## Kurulum

### 1. Bağımlılıkları yükle
```bash
cd bot-engine
npm install
```

### 2. .env dosyasını hazırla
```bash
cp .env.example .env
```

`.env` içini doldurun:
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Supabase → Settings → API → service_role key
TELEGRAM_BOT_TOKEN=123456789:AAx...
TELEGRAM_CHAT_ID=-100xxxxxxxxxx
```

> **Önemli:** `SUPABASE_SERVICE_ROLE_KEY` kullanın (anon key değil).
> Service role key RLS'yi bypass eder, botun tüm kayıtlara erişmesi gerekir.

### 3. Başlat
```bash
# Geliştirme
npm run dev

# Üretim
npm start
```

## VPS'de Sürekli Çalıştırma (PM2)

```bash
npm install -g pm2
cd bot-engine
pm2 start index.js --name "vize-bot-engine"
pm2 save
pm2 startup    # sistem açılışında otomatik başlat
```

## VFS Endpoint Ayarı

`lib/vfs-client.js` dosyasındaki `VFS_CONFIGS` nesnesini ülkeye göre doldurun:

```js
italya: {
  baseUrl: 'https://visa.vfsglobal.com',
  loginPath: '/tur/ita/login',
  slotsPath: '/tur/ita/appointment/slots',
}
```

Her ülke için doğru path'ları bulmak için:
1. Tarayıcı geliştirici araçları → Network sekmesini açın
2. VFS portalına giriş yapın
3. İstekleri inceleyin — login ve slot endpoint'lerini not alın
4. `vfs-client.js` içindeki `VFS_CONFIGS`'a ekleyin

## Panel ile Kullanım

1. `/accounts` → VFS hesabı ekle (e-posta + şifre + ülke)
2. `/bots` → Bot oluştur (hesabı seç + tarama aralığını gir)
3. `/bots` → "Başlat" butonuna bas
4. **Bu motoru** VPS'de başlat (`npm start`)
5. Motor 5 saniyede bir Supabase'i kontrol eder
6. `status = 'running'` olan botları çalıştırır
7. Sonuçlar `/logs` ve `/appointments` sayfalarında görünür
8. Randevu bulununca Telegram'a bildirim gelir

## Dosya Yapısı

```
bot-engine/
├── index.js          # Ana giriş — poll döngüsü
├── .env.example      # Örnek environment değişkenleri
├── package.json
└── lib/
    ├── supabase.js   # Supabase service client
    ├── logger.js     # DB'ye log yazar + console
    ├── runner.js     # Bot döngüsünü yönetir
    ├── vfs-client.js # VFS HTTP istekleri (özelleştirin)
    └── notifier.js   # Telegram + DB bildirimleri
```
