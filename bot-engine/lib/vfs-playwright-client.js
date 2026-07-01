/**
 * VFS Global Playwright İstemcisi
 *
 * Gerçek bir Chrome tarayıcısı açarak VFS portalına bağlanır.
 * Stealth modu ile bot algılama sistemlerini atlatır.
 *
 * Kullanım:
 *   const client = new VfsPlaywrightClient(account, logger, notifier)
 *   const slots = await client.checkAndBook(applicantData)
 *   await client.close()
 */

const path = require('path')
const fs   = require('fs')
const { attachPageListeners, captureDump }   = require('./playwright-debug')
const { getVfsConfig, validateLoginPage }    = require('../config/vfs-urls')

// Screenshot klasörü
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

class VfsPlaywrightClient {
  constructor(account, logger, notifyFn) {
    this.account   = account     // { email, encrypted_password, country, city, visa_type, visa_center }
    this.logger    = logger
    this.notifyFn  = notifyFn   // async (title, message) bildirimi gönderir
    this.browser   = null
    this.page      = null
    this.loggedIn  = false
    // Metrik flag'leri (runner.js tarafından okunur)
    this._loginSuccess       = false
    this._loginFailed        = false
    this._ipBlocked          = false
    this._slotCheckSuccess   = false
    this._captchaEncountered = false
  }

  getVfsConfig() {
    return getVfsConfig(this.account.country)
  }

  // ─────────────────────────────────────────────────────
  // Tarayıcı başlatma
  // ─────────────────────────────────────────────────────
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

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
      extraHTTPHeaders: { 'Accept-Language': 'tr-TR,tr;q=0.9' },
    })

    // Bot algılama önlemleri
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['tr-TR', 'tr'] })
      window.chrome = { runtime: {} }
    })

    this.page = await context.newPage()

    // Yalnızca tracking/analytics isteklerini engelle — görseller gerekli (Angular SPA)
    await this.page.route(/google-analytics|googletagmanager|facebook|hotjar|intercom/, r => r.abort())

    // Debug: konsol hataları ve network cevaplarını izle
    this._debugListeners = attachPageListeners(this.page)
    this._consoleErrors    = this._debugListeners.consoleErrors
    this._networkResponses = this._debugListeners.networkResponses
  }

  // ─────────────────────────────────────────────────────
  // VFS Girişi
  // ─────────────────────────────────────────────────────
  async login() {
    // ── Config'den gerçek URL'leri al ────────────────────
    const cfg = this.getVfsConfig()
    if (!cfg) {
      await this.logger.error(
        `Geçersiz VFS URL yapılandırması: "${this.account.country}" için config bulunamadı. ` +
        `bot-engine/config/vfs-urls.js dosyasına ülkeyi ekleyin.`
      )
      return false
    }

    await this.logger.info(`VFS giriş deneniyor: ${this.account.email}`)
    await this.logger.info(`Login URL (config): ${cfg.login}`)

    // VFS Global Angular Material form selektörleri (öncelik sırasına göre)
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

    try {
      // ── 1. Sayfayı aç ──────────────────────────────────
      await this.logger.info('Giriş sayfası açılıyor...')
      await this.page.goto(cfg.login, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await this.page.waitForTimeout(3000)   // Angular SPA render süresi
      await this.screenshot('01_login_page')

      const loadedUrl   = this.page.url()
      const loadedTitle = await this.page.title().catch(() => '')
      await this.logger.info(`Sayfa açıldı — URL: ${loadedUrl}`)
      await this.logger.info(`Sayfa başlığı: ${loadedTitle}`)

      // ── 2. URL / başlık doğrulaması ─────────────────────
      const { valid, reason } = validateLoginPage(loadedUrl, loadedTitle)
      if (!valid) {
        const isIpBlock = reason.toLowerCase().includes('ip engeli') || reason.toLowerCase().includes('1 saat')
        const logMsg = isIpBlock
          ? `IP engeli tespit edildi: ${reason}. Bot 65 dakika askıya alınıyor. Proxy kullanmanız önerilir.`
          : `Geçersiz VFS URL yapılandırması: ${reason} — URL: ${loadedUrl}`

        await this.logger.error(logMsg)

        await captureDump(
          this.page,
          isIpBlock ? `ip_block_${countrySlug}` : `bad_url_${countrySlug}`,
          this._consoleErrors,
          this._networkResponses,
          []
        ).catch(() => {})

        if (isIpBlock) this._ipBlocked = true
        return false
      }

      // ── 3. E-posta alanı ────────────────────────────────
      await this.logger.info('Login formu bekleniyor...')
      try {
        await this.page.waitForSelector(EMAIL_SELECTORS, { timeout: 15000 })
      } catch (err) {
        await this.logger.error('Login formu yüklenemedi — debug dump alınıyor...')
        await captureDump(
          this.page,
          `login_form_timeout_${countrySlug}`,
          this._consoleErrors,
          this._networkResponses,
          EMAIL_SELECTORS.split(', ')
        )
        throw err
      }

      // ── 4. Form doldur ve giriş yap ─────────────────────
      await this.logger.info('E-posta ve şifre dolduruluyor...')
      await this.humanType(EMAIL_SELECTORS,    this.account.email)
      await this.humanType(PASSWORD_SELECTORS, this.account.encrypted_password)
      await this.screenshot('02_login_filled')

      await this.logger.info('Giriş butonuna tıklanıyor...')
      await this.page.click(SUBMIT_SELECTORS)
      await this.page.waitForLoadState('networkidle', { timeout: 25000 })
      await this.page.waitForTimeout(2000)
      await this.screenshot('03_after_login')

      // ── 5. Giriş başarı kontrolü ─────────────────────────
      const afterLoginUrl     = this.page.url()
      const afterLoginTitle   = await this.page.title().catch(() => '')
      const afterLoginContent = await this.page.content()
      await this.logger.info(`Giriş sonrası URL: ${afterLoginUrl}`)

      // Hâlâ login sayfasında ve hata varsa
      if (afterLoginUrl.includes('/login') && (
        afterLoginContent.includes('incorrect') ||
        afterLoginContent.includes('invalid')   ||
        afterLoginContent.includes('wrong')     ||
        afterLoginContent.includes('hatalı')
      )) {
        this._loginFailed = true
        await this.logger.error('VFS girişi başarısız — e-posta veya şifre hatalı.')
        await this.screenshot('error_wrong_credentials')
        return false
      }

      // Yönlendirme sonrası URL doğrulaması
      const afterCheck = validateLoginPage(afterLoginUrl, afterLoginTitle)
      if (!afterCheck.valid) {
        await this.logger.error(`Giriş sonrası geçersiz sayfa: ${afterCheck.reason}`)
        if (afterCheck.reason.toLowerCase().includes('ip')) this._ipBlocked = true
        return false
      }

      this.loggedIn      = true
      this._loginSuccess = true
      await this.logger.success('VFS girişi başarılı.')
      return true

    } catch (err) {
      await this.screenshot('error_login')
      await this.logger.error(`VFS giriş hatası: ${err.message}`)
      await captureDump(
        this.page,
        `login_exception_${countrySlug}`,
        this._consoleErrors,
        this._networkResponses,
        []
      ).catch(() => {})
      return false
    }
  }

  // ─────────────────────────────────────────────────────
  // Randevu Slotlarını Kontrol Et
  // ─────────────────────────────────────────────────────
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
      await this.logger.info(`Randevu sayfası açıldı — URL: ${apptUrl}`)

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

      // Müsait tarihleri oku — aktif (tıklanabilir) günler
      const slots = await this.page.evaluate(() => {
        const results = []

        // Takvim günlerini ara
        document.querySelectorAll('[class*="available"], [class*="slot"], .appointment-date, td.enabled, td[data-date]').forEach(el => {
          const date = el.getAttribute('data-date') ?? el.textContent?.trim()
          if (date && date.length > 0) {
            results.push({ date, time: null, center: null })
          }
        })

        // Alternatif: tablo içindeki müsait satırları ara
        if (results.length === 0) {
          document.querySelectorAll('tr, .slot-item, .time-slot').forEach(row => {
            const text = row.textContent ?? ''
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

  // ─────────────────────────────────────────────────────
  // Randevu Al (Booking)
  // ─────────────────────────────────────────────────────
  async bookAppointment(slot, applicant) {
    await this.logger.info(`Randevu alınıyor: ${slot.date} ${slot.time ?? ''} — ${applicant.full_name}`)

    try {
      // Slota tıkla
      const slotClicked = await this.page.evaluate((targetDate) => {
        const els = document.querySelectorAll('[data-date], .available, .appointment-date')
        for (const el of els) {
          if (el.getAttribute('data-date') === targetDate || el.textContent?.includes(targetDate)) {
            el.click()
            return true
          }
        }
        return false
      }, slot.date)

      if (!slotClicked) {
        await this.logger.warning('Slot tıklanamadı, sayfa değişmiş olabilir.')
        return false
      }

      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
      await this.screenshot('06_slot_clicked')

      // Başvuran bilgilerini doldur
      await this.fillApplicantForm(applicant)
      await this.screenshot('07_form_filled')

      // CAPTCHA kontrolü
      const hasCaptcha = await this.page.evaluate(() =>
        !!document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, #captcha')
      )

      if (hasCaptcha) {
        await this.logger.warning('CAPTCHA tespit edildi! Manuel çözüm gerekiyor.')
        await this.notifyFn(
          '⚠️ CAPTCHA Çözümü Gerekiyor',
          `${applicant.full_name} için randevu alma sırasında CAPTCHA çıktı.\nLütfen sisteme manuel müdahale edin.`
        )
        // CAPTCHA için 5 dakika bekle (kullanıcı çözebilir)
        await this.page.waitForFunction(
          () => !document.querySelector('iframe[src*="recaptcha"], .g-recaptcha, #captcha'),
          { timeout: 300000 }
        ).catch(() => { })
      }

      // Onayla / Gönder
      const submitBtn = await this.page.$('button[type="submit"], .confirm-btn, [class*="submit"], [class*="book"]')
      if (submitBtn) {
        await submitBtn.click()
        await this.page.waitForLoadState('networkidle', { timeout: 20000 })
      }

      await this.screenshot('08_after_submit')

      // Başarı kontrolü
      const content = await this.page.content()
      const success  =
        content.toLowerCase().includes('confirmed') ||
        content.toLowerCase().includes('onaylandı') ||
        content.toLowerCase().includes('başarılı') ||
        content.toLowerCase().includes('booking reference') ||
        content.toLowerCase().includes('confirmation')

      if (success) {
        // Onay referans numarasını al (varsa)
        const refMatch = content.match(/[A-Z]{2,3}[-\/]?\d{6,10}/)
        const refNo = refMatch ? refMatch[0] : null
        await this.logger.success(`Randevu alındı!${refNo ? ` Referans: ${refNo}` : ''}`)
        await this.screenshot('09_booking_confirmed')
        return { success: true, reference: refNo }
      } else {
        await this.logger.error('Randevu alınamadı — sayfa içeriği beklenen yanıtı içermiyor.')
        return { success: false }
      }
    } catch (err) {
      await this.screenshot('error_booking')
      await this.logger.error(`Rezervasyon hatası: ${err.message}`)
      return { success: false, error: err.message }
    }
  }

  // ─────────────────────────────────────────────────────
  // Başvuran Formunu Doldur
  // ─────────────────────────────────────────────────────
  async fillApplicantForm(applicant) {
    const fillIfExists = async (selector, value) => {
      if (!value) return
      try {
        const el = await this.page.$(selector)
        if (el) {
          await el.clear()
          await this.humanType(selector, value)
        }
      } catch (_) {}
    }

    await fillIfExists('input[name*="first"], input[id*="first"], #txtFirstName',        applicant.first_name)
    await fillIfExists('input[name*="last"],  input[id*="last"],  #txtLastName',         applicant.last_name)
    await fillIfExists('input[name*="passport"], input[id*="passport"], #txtPassportNo', applicant.passport_number)
    await fillIfExists('input[name*="dob"],  input[id*="dob"],  #txtDOB, input[type="date"]', applicant.date_of_birth)
    await fillIfExists('input[name*="phone"], input[id*="phone"], #txtPhone',            applicant.phone)
    await fillIfExists('input[name*="email"], input[id*="email"], #txtEmail',            applicant.email)
  }

  // ─────────────────────────────────────────────────────
  // Yardımcı: İnsan gibi yazma (klavye gecikmesi ile)
  // ─────────────────────────────────────────────────────
  async humanType(selector, text) {
    await this.page.click(selector)
    await this.page.fill(selector, '')
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: 30 + Math.random() * 50 })
    }
  }

  // ─────────────────────────────────────────────────────
  // Yardımcı: Screenshot al
  // ─────────────────────────────────────────────────────
  async screenshot(name) {
    try {
      const file = path.join(SCREENSHOT_DIR, `${Date.now()}_${name}.png`)
      await this.page.screenshot({ path: file, fullPage: false })
    } catch (_) {}
  }

  // ─────────────────────────────────────────────────────
  // Tarayıcıyı kapat
  // ─────────────────────────────────────────────────────
  async close() {
    try {
      if (this._debugListeners) this._debugListeners.stop()
      if (this.browser) await this.browser.close()
    } catch (_) {}
    this.browser  = null
    this.page     = null
    this.loggedIn = false
    this._debugListeners   = null
    this._consoleErrors    = []
    this._networkResponses = []
  }
}

module.exports = { VfsPlaywrightClient }
