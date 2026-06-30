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

// Screenshot klasörü
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

// VFS Global ülke yapılandırması
// Her ülke için giriş URL'si ve randevu sayfası URL'si
const VFS_URLS = {
  italya:     { base: 'https://visa.vfsglobal.com', login: '/tur/ita/login',    appointment: '/tur/ita/appointment/schedule-appointment' },
  hollanda:   { base: 'https://visa.vfsglobal.com', login: '/tur/nld/login',    appointment: '/tur/nld/appointment/schedule-appointment' },
  almanya:    { base: 'https://visa.vfsglobal.com', login: '/tur/deu/login',    appointment: '/tur/deu/appointment/schedule-appointment' },
  fransa:     { base: 'https://visa.vfsglobal.com', login: '/tur/fra/login',    appointment: '/tur/fra/appointment/schedule-appointment' },
  ispanya:    { base: 'https://visa.vfsglobal.com', login: '/tur/esp/login',    appointment: '/tur/esp/appointment/schedule-appointment' },
  belcika:    { base: 'https://visa.vfsglobal.com', login: '/tur/bel/login',    appointment: '/tur/bel/appointment/schedule-appointment' },
  avusturya:  { base: 'https://visa.vfsglobal.com', login: '/tur/aut/login',    appointment: '/tur/aut/appointment/schedule-appointment' },
  isvicre:    { base: 'https://visa.vfsglobal.com', login: '/tur/che/login',    appointment: '/tur/che/appointment/schedule-appointment' },
  yunanistan: { base: 'https://visa.vfsglobal.com', login: '/tur/grc/login',    appointment: '/tur/grc/appointment/schedule-appointment' },
  polonya:    { base: 'https://visa.vfsglobal.com', login: '/tur/pol/login',    appointment: '/tur/pol/appointment/schedule-appointment' },
}

class VfsPlaywrightClient {
  constructor(account, logger, notifyFn) {
    this.account   = account     // { email, encrypted_password, country, city, visa_type, visa_center }
    this.logger    = logger
    this.notifyFn  = notifyFn   // async (title, message) bildirimi gönderir
    this.browser   = null
    this.page      = null
    this.loggedIn  = false
  }

  getUrls() {
    const key = (this.account.country ?? '').toLowerCase().trim()
    return VFS_URLS[key] ?? null
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

    // Gereksiz kaynakları engelle (font, resim) — daha hızlı yükleme
    await this.page.route('**/*.{png,jpg,gif,svg,woff,woff2}', r => r.abort())
  }

  // ─────────────────────────────────────────────────────
  // VFS Girişi
  // ─────────────────────────────────────────────────────
  async login() {
    const urls = this.getUrls()
    if (!urls) {
      await this.logger.error(`"${this.account.country}" için VFS URL yapılandırması bulunamadı.`)
      return false
    }

    await this.logger.info(`VFS portalına giriş: ${this.account.email}`)

    try {
      await this.page.goto(urls.base + urls.login, { waitUntil: 'networkidle', timeout: 30000 })
      await this.screenshot('01_login_page')

      // E-posta alanını bul ve doldur
      await this.page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 })
      await this.humanType('input[type="email"], input[name="email"], #email', this.account.email)

      await this.humanType('input[type="password"], input[name="password"], #password', this.account.encrypted_password)

      await this.screenshot('02_login_filled')

      // Giriş butonuna tıkla
      await this.page.click('button[type="submit"], input[type="submit"], .login-btn, [class*="signin"]')
      await this.page.waitForLoadState('networkidle', { timeout: 20000 })

      await this.screenshot('03_after_login')

      // Giriş başarı kontrolü
      const currentUrl = this.page.url()
      const pageContent = await this.page.content()

      const loginFailed =
        currentUrl.includes('/login') &&
        (pageContent.includes('hatalı') || pageContent.includes('incorrect') || pageContent.includes('invalid'))

      if (loginFailed) {
        await this.logger.error('Giriş başarısız — kullanıcı adı veya şifre hatalı.')
        return false
      }

      this.loggedIn = true
      await this.logger.success('VFS girişi başarılı.')
      return true
    } catch (err) {
      await this.screenshot('error_login')
      await this.logger.error(`Giriş hatası: ${err.message}`)
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

    const urls = this.getUrls()
    await this.logger.info(`Randevu slotları kontrol ediliyor: ${this.account.country}`)

    try {
      await this.page.goto(urls.base + urls.appointment, { waitUntil: 'networkidle', timeout: 30000 })
      await this.screenshot('04_appointment_page')

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

      if (slots.length > 0) {
        await this.logger.success(`${slots.length} müsait slot bulundu!`)
      } else {
        await this.logger.info('Şu an müsait randevu yok.')
      }

      return slots
    } catch (err) {
      await this.screenshot('error_slots')
      await this.logger.error(`Slot kontrol hatası: ${err.message}`)
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
      if (this.browser) await this.browser.close()
    } catch (_) {}
    this.browser = null
    this.page    = null
    this.loggedIn = false
  }
}

module.exports = { VfsPlaywrightClient }
