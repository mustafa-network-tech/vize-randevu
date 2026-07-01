/**
 * VFS Global Playwright İstemcisi
 *
 * Akış:
 *   1. launch()      — tarayıcı başlatılır
 *   2. checkSlots()  — login() çağrılır, slot taranır
 *   3. close()       — tarayıcı kapatılır
 *
 * Session Expired koruması:
 *   - Her login denemesinde TAMAMEN YENİ BrowserContext açılır (cookie/storage sıfır).
 *   - Önce ülkeye ait ana sayfa açılır, çerez popup'ı kabul edilir.
 *   - Ardından login sayfasına geçilir.
 *   - "Session Expired or Invalid" tespit edilirse context atılır, max 1 kez retry yapılır.
 */

const path = require('path')
const fs   = require('fs')
const { attachPageListeners, captureDump } = require('./playwright-debug')
const { getVfsConfig, validateLoginPage, isSessionExpired } = require('../config/vfs-urls')

// Screenshot klasörü
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// Cookie popup butonları — sırayla denenir
const COOKIE_SELECTORS = [
  '#onetrust-accept-btn-handler',
  'button[id*="accept"]',
  'button[class*="accept"]',
  'button[aria-label*="Accept All"]',
  'button[aria-label*="Accept"]',
  'button[aria-label*="Agree"]',
  'button:has-text("Accept All Cookies")',
  'button:has-text("Accept All")',
  'button:has-text("Accept Cookies")',
  'button:has-text("Accept")',
  'button:has-text("I Accept")',
  'button:has-text("Agree")',
  'button:has-text("Kabul")',
  '.cookie-accept',
  '.accept-cookies',
]

class VfsPlaywrightClient {
  constructor(account, logger, notifyFn) {
    this.account  = account
    this.logger   = logger
    this.notifyFn = notifyFn

    this.browser  = null
    this.page     = null
    this.loggedIn = false

    // Metrik flag'leri (runner.js tarafından okunur)
    this._loginSuccess       = false
    this._loginFailed        = false
    this._ipBlocked          = false
    this._slotCheckSuccess   = false
    this._captchaEncountered = false

    this._debugListeners   = null
    this._consoleErrors    = []
    this._networkResponses = []
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tarayıcı başlatma
  // ─────────────────────────────────────────────────────────────────────────
  async launch() {
    const { chromium } = require('playwright')

    this.browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-size=1366,768',
      ],
    })

    // İlk temiz context'i oluştur
    await this._createFreshContext()
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Temiz BrowserContext oluştur — önceki cookie/storage tamamen atılır
  // ─────────────────────────────────────────────────────────────────────────
  async _createFreshContext() {
    // Eski context'i kapat (browser açık kalır)
    if (this.page) {
      try { await this.page.context().close() } catch (_) {}
      this.page = null
    }
    if (this._debugListeners) {
      try { this._debugListeners.stop() } catch (_) {}
      this._debugListeners = null
    }
    this._consoleErrors    = []
    this._networkResponses = []
    this.loggedIn          = false

    const context = await this.browser.newContext({
      userAgent:         USER_AGENT,
      viewport:          { width: 1366, height: 768 },
      locale:            'tr-TR',
      timezoneId:        'Europe/Istanbul',
      extraHTTPHeaders:  { 'Accept-Language': 'tr-TR,tr;q=0.9' },
      // storageState yok → cookie/localStorage/sessionStorage sıfır
    })

    // Bot tespitini zorlaştır
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver',  { get: () => undefined })
      Object.defineProperty(navigator, 'plugins',    { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages',  { get: () => ['tr-TR', 'tr'] })
      window.chrome = { runtime: {} }
    })

    this.page = await context.newPage()

    // Tracking/analytics isteklerini engelle (görseller gerekli — Angular SPA)
    await this.page.route(/google-analytics|googletagmanager|facebook|hotjar|intercom|doubleclick/, r => r.abort())

    // Debug dinleyicileri
    this._debugListeners   = attachPageListeners(this.page)
    this._consoleErrors    = this._debugListeners.consoleErrors
    this._networkResponses = this._debugListeners.networkResponses

    await this.logger.info('[context] Temiz BrowserContext oluşturuldu — tüm cookie ve storage sıfırlandı.')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Çerez / Cookie popup'ı otomatik kabul et
  // ─────────────────────────────────────────────────────────────────────────
  async _acceptCookies() {
    for (const sel of COOKIE_SELECTORS) {
      try {
        const btn = await this.page.$(sel)
        if (btn && await btn.isVisible()) {
          await btn.click({ timeout: 3000 })
          await this.page.waitForTimeout(800)
          await this.logger.info('[cookie] Çerez onay popup\'ı kabul edildi.')
          return true
        }
      } catch (_) {}
    }
    return false
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Ana sayfayı aç, çerezleri kabul et, ardından login sayfasına geç
  // ─────────────────────────────────────────────────────────────────────────
  async _navigateToLogin(cfg) {
    // ── 1. Ana sayfa ─────────────────────────────────────
    await this.logger.info(`Ana sayfa açılıyor: ${cfg.home}`)
    await this.page.goto(cfg.home, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await this.page.waitForTimeout(2500)
    await this.screenshot('00_home_page')

    // ── 2. Ana sayfada çerez popup'ı ─────────────────────
    await this._acceptCookies()

    // ── 3. Login sayfasına geç ───────────────────────────
    await this.logger.info(`Login sayfasına geçiliyor: ${cfg.login}`)
    await this.page.goto(cfg.login, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // ── 4. Ağ tamamen yüklensin ───────────────────────────
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
    } catch (_) {
      await this.logger.warning('networkidle zaman aşımı — DOM taramasına devam ediliyor.')
    }

    // ── 5. Login sayfasında da çerez popup'ı olabilir ────
    await this._acceptCookies()

    // ── 6. Angular/SPA render için ek bekleme ────────────
    await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 2000))  // 3-5s
    await this.screenshot('01_login_page')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tüm iframe'leri tarayarak giriş formunu arar, bulduklarını loglar
  // ─────────────────────────────────────────────────────────────────────────
  async _searchIframesForLoginForm() {
    await this.logger.info('[iframe] Ana DOM\'da form bulunamadı — iframe\'ler taranıyor...')
    const frames = this.page.frames()
    await this.logger.info(`[iframe] Toplam frame sayısı: ${frames.length}`)

    const IFRAME_SELECTORS = [
      'input[type="email"]',
      'input[type="password"]',
      'input[name="email"]',
      'input[name="password"]',
      'input[name="username"]',
      'input[formcontrolname="username"]',
      'input[formcontrolname="password"]',
      'input[id*="email"]',
      'input[id*="password"]',
    ]

    let foundFrame = null
    let foundEmailSel = null
    let foundPasswordSel = null

    for (const frame of frames) {
      const frameUrl = frame.url()
      if (frameUrl === 'about:blank' || frameUrl === '') continue

      await this.logger.info(`[iframe] Frame inceleniyor: ${frameUrl}`)

      const found = []
      for (const sel of IFRAME_SELECTORS) {
        try {
          const el = await frame.$(sel)
          if (el) {
            found.push(sel)
            await this.logger.info(`[iframe]   ✓ Bulundu: "${sel}" — frame: ${frameUrl}`)
          }
        } catch (_) {}
      }

      if (found.length > 0) {
        // Email ve password selector'larını ayır
        const emailSel = found.find(s =>
          s.includes('email') || s.includes('username') || s.includes('"email"')
        ) ?? null
        const pwSel = found.find(s => s.includes('password')) ?? null

        if (emailSel || pwSel) {
          foundFrame     = frame
          foundEmailSel  = emailSel
          foundPasswordSel = pwSel
          await this.logger.info(`[iframe] ✅ Giriş formu bulundu — frame: ${frameUrl}`)
          break
        }
      }
    }

    return { frame: foundFrame, emailSel: foundEmailSel, passwordSel: foundPasswordSel }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VFS Girişi  (Session Expired → otomatik context yenile + 1 retry)
  // ─────────────────────────────────────────────────────────────────────────
  async login() {
    const cfg = this.getVfsConfig()
    if (!cfg) {
      await this.logger.error(
        `Geçersiz VFS URL yapılandırması: "${this.account.country}" için config bulunamadı. ` +
        `bot-engine/config/vfs-urls.js dosyasına ülkeyi ekleyin.`
      )
      return false
    }

    await this.logger.info(`VFS giriş deneniyor: ${this.account.email}`)

    const EMAIL_SELECTORS = [
      'input[formcontrolname="username"]',
      'input[formcontrolname="email"]',
      'input[formcontrolname="loginId"]',
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email"]',
      '#email',
      'input[id*="username"]',
      'input[name="username"]',
    ].join(', ')

    const PASSWORD_SELECTORS = [
      'input[formcontrolname="password"]',
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password"]',
      '#password',
    ].join(', ')

    const SUBMIT_SELECTORS = [
      'button[type="submit"]',
      'button.mat-raised-button',
      'button.mat-flat-button',
      'input[type="submit"]',
      '.login-btn',
    ].join(', ')

    const countrySlug = (this.account.country ?? 'unknown').replace(/\s/g, '_')

    // En fazla 2 deneme (1 normal + 1 session-expired retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt === 2) {
        await this.logger.warning('[session] Session Expired/Invalid tespit edildi — yeni context ile tekrar deneniyor...')
        await this._createFreshContext()
      }

      try {
        // ── 1. Ana sayfa → login sayfası ─────────────────
        await this._navigateToLogin(cfg)

        const loadedUrl   = this.page.url()
        const loadedTitle = await this.page.title().catch(() => '')
        await this.logger.info(`Sayfa açıldı — URL: ${loadedUrl}`)
        await this.logger.info(`Sayfa başlığı: ${loadedTitle}`)

        // ── 2. URL / başlık doğrula ───────────────────────
        const { valid, reason } = validateLoginPage(loadedUrl, loadedTitle)
        if (!valid) {
          const isIpBlock = reason.toLowerCase().includes('ip engeli') || reason.toLowerCase().includes('1 saat')
          const logMsg = isIpBlock
            ? `IP engeli tespit edildi: ${reason}. Bot 65 dakika askıya alınıyor.`
            : `Geçersiz VFS sayfası: ${reason} — URL: ${loadedUrl}`
          await this.logger.error(logMsg)
          await captureDump(this.page, isIpBlock ? `ip_block_${countrySlug}` : `bad_url_${countrySlug}`, this._consoleErrors, this._networkResponses, []).catch(() => {})
          if (isIpBlock) this._ipBlocked = true
          return false
        }

        // ── 3. Session Expired kontrolü ───────────────────
        const pageContent = await this.page.content().catch(() => '')
        if (isSessionExpired(loadedUrl, loadedTitle, pageContent)) {
          await this.screenshot(`session_expired_attempt${attempt}`)
          if (attempt === 2) {
            await this.logger.error('[session] Session Expired 2. denemede de tekrarlandı — login başarısız.')
            this._loginFailed = true
            return false
          }
          // 1. denemede → retry yapılacak (döngü devam eder)
          continue
        }

        // ── 4. Form bekleniyor ────────────────────────────
        await this.logger.info('Login formu bekleniyor...')
        let useFrame = null       // null → ana sayfa, Frame → iframe içinde
        let emailSel  = EMAIL_SELECTORS
        let pwSel     = PASSWORD_SELECTORS
        let submitSel = SUBMIT_SELECTORS

        const formFoundInMain = await this.page.$(EMAIL_SELECTORS).then(el => !!el).catch(() => false)

        if (!formFoundInMain) {
          // Ana DOM'da form yok — networkidle + ek bekleme + tekrar dene
          await this.logger.info('Form henüz yüklenmedi, ek 3s bekleniyor ve DOM yeniden taranıyor...')
          await this.page.waitForTimeout(3000)

          const formFoundAfterWait = await this.page.$(EMAIL_SELECTORS).then(el => !!el).catch(() => false)

          if (!formFoundAfterWait) {
            // Session expired kontrolü
            const content2 = await this.page.content().catch(() => '')
            if (isSessionExpired(this.page.url(), await this.page.title().catch(() => ''), content2)) {
              await this.screenshot(`session_expired_form_attempt${attempt}`)
              if (attempt === 2) {
                await this.logger.error('[session] Session Expired: form bulunamadı, 2. deneme de başarısız.')
                this._loginFailed = true
                return false
              }
              continue
            }

            // iframe taraması
            const iframeResult = await this._searchIframesForLoginForm()
            if (iframeResult.frame && (iframeResult.emailSel || iframeResult.passwordSel)) {
              useFrame  = iframeResult.frame
              emailSel  = iframeResult.emailSel  ?? EMAIL_SELECTORS
              pwSel     = iframeResult.passwordSel ?? PASSWORD_SELECTORS
              await this.logger.info('[iframe] Form iframe içinde bulundu — iframe bağlamında devam ediliyor.')
            } else {
              // Hiçbir yerde bulunamadı → dump al + hata fırlat
              await this.logger.error('Login formu hiçbir yerde bulunamadı — debug dump alınıyor...')
              await captureDump(this.page, `login_form_notfound_${countrySlug}_attempt${attempt}`, this._consoleErrors, this._networkResponses, EMAIL_SELECTORS.split(', '))
              if (attempt === 2) {
                this._loginFailed = true
                return false
              }
              continue  // 1. denemede retry
            }
          }
        }

        // ── 5. Form doldur ve giriş yap ───────────────────
        await this.logger.info('E-posta ve şifre dolduruluyor...')
        if (useFrame) {
          // iframe bağlamında doldur
          await useFrame.fill(emailSel, this.account.email)
          await this.page.waitForTimeout(300 + Math.random() * 300)
          await useFrame.fill(pwSel, this.account.encrypted_password)
        } else {
          await this.humanType(emailSel, this.account.email)
          await this.humanType(pwSel,    this.account.encrypted_password)
        }
        await this.screenshot('02_login_filled')

        await this.logger.info('Giriş butonuna tıklanıyor...')
        if (useFrame) {
          await useFrame.click(submitSel).catch(() => {})
        } else {
          await this.page.click(submitSel)
        }
        await this.page.waitForLoadState('networkidle', { timeout: 25000 })
        await this.page.waitForTimeout(2000)
        await this.screenshot('03_after_login')

        // ── 6. Giriş sonrası kontrol ──────────────────────
        const afterUrl     = this.page.url()
        const afterTitle   = await this.page.title().catch(() => '')
        const afterContent = await this.page.content().catch(() => '')
        await this.logger.info(`Giriş sonrası URL: ${afterUrl}`)

        // Session expired sonrası redirect?
        if (isSessionExpired(afterUrl, afterTitle, afterContent)) {
          if (attempt === 2) {
            await this.logger.error('[session] Giriş sonrası Session Expired — 2. deneme başarısız.')
            this._loginFailed = true
            return false
          }
          await this.screenshot(`session_expired_after_login_attempt${attempt}`)
          continue
        }

        // Hâlâ login sayfasında ve hata varsa
        if (afterUrl.includes('/login') && (
          afterContent.includes('incorrect') ||
          afterContent.includes('invalid')   ||
          afterContent.includes('wrong')     ||
          afterContent.includes('hatalı')
        )) {
          this._loginFailed = true
          await this.logger.error('VFS girişi başarısız — e-posta veya şifre hatalı.')
          await this.screenshot('error_wrong_credentials')
          return false
        }

        // URL geçerlilik kontrolü
        const afterCheck = validateLoginPage(afterUrl, afterTitle)
        if (!afterCheck.valid) {
          await this.logger.error(`Giriş sonrası geçersiz sayfa: ${afterCheck.reason}`)
          if (afterCheck.reason.toLowerCase().includes('ip')) this._ipBlocked = true
          return false
        }

        // ── 7. Başarı ─────────────────────────────────────
        this.loggedIn      = true
        this._loginSuccess = true
        await this.logger.success('VFS girişi başarılı.')
        return true

      } catch (err) {
        await this.screenshot('error_login')
        await this.logger.error(`VFS giriş hatası (deneme ${attempt}): ${err.message}`)
        await captureDump(this.page, `login_exception_${countrySlug}_attempt${attempt}`, this._consoleErrors, this._networkResponses, []).catch(() => {})
        if (attempt === 2) return false
        // 1. denemede beklenmedik hata → retry
      }
    }

    return false
  }

  getVfsConfig() {
    return getVfsConfig(this.account.country)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Randevu Slotlarını Kontrol Et
  // ─────────────────────────────────────────────────────────────────────────
  async checkSlots() {
    if (!this.loggedIn) {
      const ok = await this.login()
      if (!ok) return []
    }

    const cfg = this.getVfsConfig()
    await this.logger.info(`Randevu sayfasına gidiliyor: ${cfg.appointment}`)

    try {
      await this.page.goto(cfg.appointment, { waitUntil: 'networkidle', timeout: 30000 })
      await this.screenshot('04_appointment_page')

      const apptUrl   = this.page.url()
      const apptTitle = await this.page.title().catch(() => '')
      const apptContent = await this.page.content().catch(() => '')
      await this.logger.info(`Randevu sayfası açıldı — URL: ${apptUrl}`)

      // Session expired kontrolü
      if (isSessionExpired(apptUrl, apptTitle, apptContent)) {
        await this.logger.warning('[session] Randevu sayfasında Session Expired — login yeniden yapılacak.')
        this.loggedIn = false
        const retryOk = await this.login()
        if (!retryOk) return []
        return await this.checkSlots()
      }

      // Randevu sayfası doğrulaması
      const apptCheck = validateLoginPage(apptUrl, apptTitle)
      if (!apptCheck.valid) {
        await this.logger.error(`Randevu sayfası geçersiz: ${apptCheck.reason}`)
        if (apptCheck.reason.toLowerCase().includes('ip')) this._ipBlocked = true
        return []
      }

      // Şehir/merkez seç (varsa)
      if (this.account.city) {
        try {
          await this.page.selectOption('select[name*="city"], select[id*="city"], #ddlCity', { label: this.account.city }, { timeout: 5000 })
          await this.page.waitForLoadState('networkidle', { timeout: 10000 })
        } catch (_) {
          await this.logger.warning('Şehir seçimi yapılamadı, devam ediliyor.')
        }
      }

      // Vize tipi seç (varsa)
      if (this.account.visa_type) {
        try {
          await this.page.selectOption('select[name*="visa"], select[id*="visa"], #ddlVisaCategory', { label: this.account.visa_type }, { timeout: 5000 })
          await this.page.waitForLoadState('networkidle', { timeout: 10000 })
        } catch (_) {
          await this.logger.warning('Vize tipi seçimi yapılamadı, devam ediliyor.')
        }
      }

      await this.screenshot('05_slot_selection')
      await this.logger.info('Randevu slotları taranıyor...')

      const slots = await this.page.evaluate(() => {
        const results = []

        document.querySelectorAll('[class*="available"], [class*="slot"], .appointment-date, td.enabled, td[data-date]').forEach(el => {
          const date = el.getAttribute('data-date') ?? el.textContent?.trim()
          if (date && date.length > 0) results.push({ date, time: null, center: null })
        })

        if (results.length === 0) {
          document.querySelectorAll('tr, .slot-item, .time-slot').forEach(row => {
            const text      = row.textContent ?? ''
            const dateMatch = text.match(/(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{4}|\d{4}-\d{2}-\d{2})/)
            const timeMatch = text.match(/(\d{1,2}:\d{2})/)
            if (dateMatch && (row.classList.contains('available') || row.querySelector('[class*="available"]'))) {
              results.push({ date: dateMatch[1], time: timeMatch?.[1] ?? null, center: null })
            }
          })
        }

        return results
      })

      this._slotCheckSuccess = true
      await this.logger.info(`Randevu kontrol tamamlandı — ${slots.length} slot bulundu.`)

      if (slots.length > 0) {
        await this.logger.success(`✅ ${slots.length} müsait randevu slotu bulundu: ${slots.map(s => s.date).join(', ')}`)
      } else {
        await this.logger.info('Randevu bulunamadı — şu an müsait slot yok.')
      }

      return slots

    } catch (err) {
      await this.screenshot('error_slots')
      await this.logger.error(`Randevu kontrol hatası: ${err.message}`)
      await captureDump(
        this.page,
        `slots_error_${(this.account.country ?? 'unknown').replace(/\s/g, '_')}`,
        this._consoleErrors,
        this._networkResponses,
        []
      ).catch(() => {})
      return []
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Randevu Al (Booking)
  // ─────────────────────────────────────────────────────────────────────────
  async bookAppointment(slot, applicant) {
    await this.logger.info(`Randevu alınıyor: ${slot.date} ${slot.time ?? ''} — ${applicant.full_name}`)

    try {
      const slotClicked = await this.page.evaluate((targetDate) => {
        const els = document.querySelectorAll('[data-date], .available, .appointment-date')
        for (const el of els) {
          if (el.getAttribute('data-date') === targetDate || el.textContent?.includes(targetDate)) {
            el.click(); return true
          }
        }
        return false
      }, slot.date)

      if (!slotClicked) {
        await this.logger.warning('Slot tıklanamadı, sayfa değişmiş olabilir.')
        return { success: false }
      }

      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
      await this.screenshot('06_slot_clicked')

      await this.fillApplicantForm(applicant)
      await this.screenshot('07_form_filled')

      const hasCaptcha = await this.page.evaluate(() =>
        !!document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, #captcha')
      )

      if (hasCaptcha) {
        this._captchaEncountered = true
        await this.logger.warning('CAPTCHA tespit edildi! Manuel çözüm gerekiyor.')
        await this.notifyFn('⚠️ CAPTCHA Çözümü Gerekiyor',
          `${applicant.full_name} için randevu alma sırasında CAPTCHA çıktı. Lütfen manuel müdahale edin.`)
        await this.page.waitForFunction(
          () => !document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, #captcha'),
          { timeout: 300000 }
        ).catch(() => {})
      }

      const submitBtn = await this.page.$('button[type="submit"], .confirm-btn, [class*="submit"], [class*="book"]')
      if (submitBtn) {
        await submitBtn.click()
        await this.page.waitForLoadState('networkidle', { timeout: 20000 })
      }

      await this.screenshot('08_after_submit')

      const content = await this.page.content()
      const success  =
        content.toLowerCase().includes('confirmed')       ||
        content.toLowerCase().includes('onaylandı')       ||
        content.toLowerCase().includes('başarılı')        ||
        content.toLowerCase().includes('booking reference')||
        content.toLowerCase().includes('confirmation')

      if (success) {
        const refMatch = content.match(/[A-Z]{2,3}[-\/]?\d{6,10}/)
        const refNo    = refMatch ? refMatch[0] : null
        await this.logger.success(`Randevu alındı!${refNo ? ` Referans: ${refNo}` : ''}`)
        await this.screenshot('09_booking_confirmed')
        return { success: true, reference: refNo }
      } else {
        await this.logger.error('Randevu alınamadı — sayfa beklenen yanıtı içermiyor.')
        return { success: false }
      }
    } catch (err) {
      await this.screenshot('error_booking')
      await this.logger.error(`Rezervasyon hatası: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Başvuran Formunu Doldur
  // ─────────────────────────────────────────────────────────────────────────
  async fillApplicantForm(applicant) {
    const fillIfExists = async (selector, value) => {
      if (!value) return
      try {
        const el = await this.page.$(selector)
        if (el) { await el.clear(); await this.humanType(selector, value) }
      } catch (_) {}
    }

    await fillIfExists('input[name*="first"], input[id*="first"], #txtFirstName',        applicant.first_name)
    await fillIfExists('input[name*="last"],  input[id*="last"],  #txtLastName',         applicant.last_name)
    await fillIfExists('input[name*="passport"], input[id*="passport"], #txtPassportNo', applicant.passport_number)
    await fillIfExists('input[name*="dob"],  input[id*="dob"],  #txtDOB, input[type="date"]', applicant.date_of_birth)
    await fillIfExists('input[name*="phone"], input[id*="phone"], #txtPhone',            applicant.phone)
    await fillIfExists('input[name*="email"], input[id*="email"], #txtEmail',            applicant.email)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // İnsan gibi yazma
  // ─────────────────────────────────────────────────────────────────────────
  async humanType(selector, text) {
    await this.page.click(selector)
    await this.page.fill(selector, '')
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: 30 + Math.random() * 50 })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Screenshot al
  // ─────────────────────────────────────────────────────────────────────────
  async screenshot(name) {
    try {
      const file = path.join(SCREENSHOT_DIR, `${Date.now()}_${name}.png`)
      await this.page.screenshot({ path: file, fullPage: false })
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tarayıcıyı kapat
  // ─────────────────────────────────────────────────────────────────────────
  async close() {
    try {
      if (this._debugListeners) this._debugListeners.stop()
    } catch (_) {}
    try {
      if (this.page) await this.page.context().close()
    } catch (_) {}
    try {
      if (this.browser) await this.browser.close()
    } catch (_) {}
    this.browser           = null
    this.page              = null
    this.loggedIn          = false
    this._debugListeners   = null
    this._consoleErrors    = []
    this._networkResponses = []
  }
}

module.exports = { VfsPlaywrightClient }
