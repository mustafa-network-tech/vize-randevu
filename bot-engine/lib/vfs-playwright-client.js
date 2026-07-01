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

// Cookie popup buton metinleri — öncelik sırasıyla
const COOKIE_BUTTON_TEXTS = [
  'Tüm Tanımlama Bilgilerini Kabul Et',
  'Accept All Cookies',
  'Accept All',
  'Accept Cookies',
  'Accept',
  'I Accept',
  'Agree',
  'Kabul Et',
  'Kabul',
  'Tümünü Reddet',
  'Reject All',
]

// CSS selector tabanlı cookie düğmeleri (metin eşleşmesi yoksa fallback)
const COOKIE_CSS_SELECTORS = [
  '#onetrust-accept-btn-handler',
  '#onetrust-reject-all-handler',
  'button[id*="accept-all"]',
  'button[id*="acceptAll"]',
  'button[class*="accept-all"]',
  'button[aria-label*="Accept All"]',
  'button[aria-label*="Accept"]',
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
  // Tek bir context (page veya frame) içinde cookie popup butonu ara ve tıkla
  // Döner: tıklanan buton metni veya null
  // ─────────────────────────────────────────────────────────────────────────
  async _clickCookieInContext(ctx) {
    // 1. Metin tabanlı arama (öncelikli)
    for (const text of COOKIE_BUTTON_TEXTS) {
      try {
        const btn = await ctx.$(`button:has-text("${text}")`)
        if (btn && await btn.isVisible().catch(() => false)) {
          await btn.click({ timeout: 3000 })
          return text
        }
      } catch (_) {}
    }

    // 2. CSS selector tabanlı fallback
    for (const sel of COOKIE_CSS_SELECTORS) {
      try {
        const btn = await ctx.$(sel)
        if (btn && await btn.isVisible().catch(() => false)) {
          await btn.click({ timeout: 3000 })
          return sel
        }
      } catch (_) {}
    }

    return null
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cookie popup'ı kapat — ana sayfa + tüm iframe'ler taranır.
  // Tıklamadan sonra 2 saniye bekler.
  // Döner: { closed: boolean, via: string|null }
  // ─────────────────────────────────────────────────────────────────────────
  async _acceptCookies() {
    // Önce ana sayfayı dene
    const mainResult = await this._clickCookieInContext(this.page)
    if (mainResult) {
      await this.page.waitForTimeout(2000)
      await this.logger.info(`[cookie] ✓ Çerez popup kapatıldı (ana sayfa) — "${mainResult}"`)
      return { closed: true, via: mainResult }
    }

    // Sonra tüm iframe'leri tara
    const frames = this.page.frames()
    for (const frame of frames) {
      const fUrl = frame.url()
      if (!fUrl || fUrl === 'about:blank') continue
      const frameResult = await this._clickCookieInContext(frame)
      if (frameResult) {
        await this.page.waitForTimeout(2000)
        await this.logger.info(`[cookie] ✓ Çerez popup kapatıldı (iframe: ${fUrl}) — "${frameResult}"`)
        return { closed: true, via: frameResult }
      }
    }

    return { closed: false, via: null }
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
    const homeCookie = await this._acceptCookies()
    if (!homeCookie.closed) {
      await this.logger.info('[cookie] Ana sayfada çerez popup tespit edilmedi.')
    }

    // ── 3. Login sayfasına geç ───────────────────────────
    await this.logger.info(`Login sayfasına geçiliyor: ${cfg.login}`)
    await this.page.goto(cfg.login, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // ── 4. networkidle ───────────────────────────────────
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 15000 })
    } catch (_) {
      await this.logger.warning('[nav] networkidle zaman aşımı — DOM taramasına devam ediliyor.')
    }

    // ── 5. Login sayfasındaki çerez popup'ı ─────────────
    await this.logger.info('[cookie] Login sayfasında çerez popup aranıyor (ana sayfa + iframe)...')
    const loginCookie = await this._acceptCookies()
    if (loginCookie.closed) {
      await this.logger.info(`[cookie] ✓ Çerez popup kapatıldı — "${loginCookie.via}"`)
    } else {
      await this.logger.warning('[cookie] Çerez popup bulunamadı veya zaten kapalı.')
      await this.screenshot('01_cookie_not_found')
    }

    // ── 6. Angular/SPA render için ek bekleme ────────────
    await this.page.waitForTimeout(3000 + Math.floor(Math.random() * 2000))  // 3-5s
    await this.screenshot('01_login_page')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOM Teşhisi — mevcut sayfa durumunu loglar, input sayısını döndürür
  // ─────────────────────────────────────────────────────────────────────────
  async _diagnoseDom(label = '') {
    try {
      const info = await this.page.evaluate(() => ({
        readyState:   document.readyState,
        bodyLen:      document.body ? document.body.innerHTML.length : 0,
        inputs:       document.querySelectorAll('input').length,
        forms:        document.querySelectorAll('form').length,
        iframes:      document.querySelectorAll('iframe').length,
        title:        document.title,
        href:         location.href,
        hasNuxt:      typeof window.__NUXT__ !== 'undefined',
        hasInitState: typeof window.__INITIAL_STATE__ !== 'undefined',
        hasNextData:  typeof window.__NEXT_DATA__ !== 'undefined',
      }))

      const prefix = label ? `[diag:${label}]` : '[diag]'
      await this.logger.info(
        `${prefix} readyState=${info.readyState} | ` +
        `bodyLen=${info.bodyLen} | inputs=${info.inputs} | ` +
        `forms=${info.forms} | iframes=${info.iframes}`
      )
      await this.logger.info(
        `${prefix} title="${info.title}" | href=${info.href}`
      )

      const frameworks = []
      if (info.hasNuxt)      frameworks.push('Nuxt (__NUXT__)')
      if (info.hasInitState) frameworks.push('__INITIAL_STATE__')
      if (info.hasNextData)  frameworks.push('Next.js (__NEXT_DATA__)')
      if (frameworks.length > 0) {
        await this.logger.info(`${prefix} Framework tespit edildi: ${frameworks.join(', ')}`)
      } else {
        await this.logger.info(`${prefix} Bilinen framework objesi bulunamadı (Nuxt/Next/Initial yok)`)
      }

      return info.inputs
    } catch (err) {
      await this.logger.warning(`[diag] evaluate hatası: ${err.message}`)
      return -1
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MutationObserver ile 20 sn boyunca DOM'a input eklenmesini bekler.
  // input oluşursa resolve({ appeared: true }), timeout → resolve({ appeared: false })
  // ─────────────────────────────────────────────────────────────────────────
  async _waitForInputViaMutation(timeoutMs = 20000) {
    try {
      const appeared = await this.page.evaluate((ms) => {
        return new Promise((resolve) => {
          if (document.querySelectorAll('input').length > 0) {
            resolve(true)
            return
          }
          const timer = setTimeout(() => {
            observer.disconnect()
            resolve(false)
          }, ms)

          const observer = new MutationObserver(() => {
            if (document.querySelectorAll('input').length > 0) {
              clearTimeout(timer)
              observer.disconnect()
              resolve(true)
            }
          })
          observer.observe(document.documentElement, { childList: true, subtree: true })
        })
      }, timeoutMs)
      return appeared
    } catch (err) {
      await this.logger.warning(`[mutation] Observer hatası: ${err.message}`)
      return false
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Selector listesini tek tek deneyerek ilk bulunanı döndürür.
  // Hem sayfa (this.page) hem de belirtilen frame içinde arar.
  // ─────────────────────────────────────────────────────────────────────────
  async _findSelector(selectorList, context = null) {
    const ctx = context ?? this.page
    for (const sel of selectorList) {
      try {
        const el = await ctx.$(sel)
        if (el) return sel
      } catch (_) {}
    }
    return null
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

    // Email selector'ları — öncelik sırasına göre tek tek denenir
    const EMAIL_SELECTOR_LIST = [
      'input[type="email"]',
      'input[name="email"]',
      'input[id*="email"]',
      'input[type="text"]',
      'input[autocomplete="username"]',
      'input[formcontrolname="username"]',
      'input[formcontrolname="email"]',
      'input[formcontrolname="loginId"]',
      'input[name="username"]',
      'input[id*="username"]',
      '#email',
    ]

    // Password selector'ları
    const PASSWORD_SELECTOR_LIST = [
      'input[type="password"]',
      'input[name="password"]',
      'input[id*="password"]',
      'input[formcontrolname="password"]',
      '#password',
    ]

    const SUBMIT_SELECTOR_LIST = [
      'button[type="submit"]',
      'button.mat-raised-button',
      'button.mat-flat-button',
      'input[type="submit"]',
      '.login-btn',
    ]

    const countrySlug = (this.account.country ?? 'unknown').replace(/\s/g, '_')

    // En fazla 2 deneme (1 normal + 1 session-expired retry)
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt === 2) {
        await this.logger.warning('[session] Session Expired/Invalid tespit edildi — yeni context ile tekrar deneniyor...')
        await this._createFreshContext()
      }

      try {
        // ── 1. Ana sayfa → networkidle → çerez → login URL ───
        await this._navigateToLogin(cfg)

        const loadedUrl   = this.page.url()
        const loadedTitle = await this.page.title().catch(() => '')
        await this.logger.info(`Sayfa açıldı — URL: ${loadedUrl}`)
        await this.logger.info(`Sayfa başlığı: ${loadedTitle}`)

        // ── 2. Sayfa içeriği + URL / başlık doğrulama ────────
        const pageContent = await this.page.content().catch(() => '')
        const { valid, reason, isIpBlock } = validateLoginPage(loadedUrl, loadedTitle, pageContent)
        if (!valid) {
          await this.logger.error(isIpBlock
            ? `IP engeli / bot engeli tespit edildi: ${reason}. Bot 65 dakika askıya alınıyor.`
            : `Geçersiz VFS sayfası: ${reason} — URL: ${loadedUrl}`)
          await captureDump(this.page, isIpBlock ? `ip_block_${countrySlug}` : `bad_url_${countrySlug}`, this._consoleErrors, this._networkResponses, []).catch(() => {})
          if (isIpBlock) this._ipBlocked = true
          return false
        }

        // ── 3. Session Expired kontrolü ───────────────────────
        if (isSessionExpired(loadedUrl, loadedTitle, pageContent)) {
          await this.screenshot(`session_expired_attempt${attempt}`)
          if (attempt === 2) {
            await this.logger.error('[session] Session Expired 2. denemede de tekrarlandı — login başarısız.')
            this._loginFailed = true
            return false
          }
          continue
        }

        // ── 4. Cookie popup — login sayfası yüklendikten sonra ─
        // (3s SPA bekleme _navigateToLogin'de zaten yapıldı)
        // Eğer login sayfasında yeniden çıkmışsa yakala
        await this.logger.info('[cookie] Login sayfası sonrası çerez popup kontrol ediliyor...')
        const postNavCookie = await this._acceptCookies()
        if (postNavCookie.closed) {
          await this.logger.info(`[cookie] ✓ Çerez popup kapatıldı — "${postNavCookie.via}"`)
          await this.page.waitForTimeout(1000)
        } else {
          await this.logger.info('[cookie] Çerez popup yok veya zaten kapatılmış.')
        }

        // ── 5. Form Tespiti ───────────────────────────────────
        await this.logger.info('[form] Login formu aranıyor...')

        let foundEmailSel  = null
        let foundPwSel     = null
        let foundSubmitSel = null
        let formFrame      = null   // null = ana sayfa, Frame = iframe

        // 5-A. İlk DOM teşhisi
        let inputCount = await this._diagnoseDom('ilk')

        // 5-B. Input yoksa → networkidle bekle + tekrar teşhis
        if (inputCount === 0) {
          await this.logger.warning('[form] Input sayısı 0 — networkidle bekleniyor...')
          try {
            await this.page.waitForLoadState('networkidle', { timeout: 10000 })
          } catch (_) {}
          inputCount = await this._diagnoseDom('networkidle-sonrasi')
        }

        // 5-C. Hâlâ 0 → MutationObserver ile 20s DOM değişimini izle
        if (inputCount === 0) {
          await this.logger.warning('[form] Input hâlâ 0 — MutationObserver kuruldu (20s bekleniyor)...')
          const appeared = await this._waitForInputViaMutation(20000)
          if (appeared) {
            inputCount = await this._diagnoseDom('mutation-sonrasi')
            await this.logger.info('[form] ✓ Login formu sonradan render edildi (MutationObserver)')
            await this.screenshot('01c_after_mutation')
          } else {
            // 5-D. 20 saniye geçti, hiç input yok → kesin teşhis + dump
            await this.logger.error('[form] Sayfa hiç login formu üretmedi (20s MutationObserver süresi doldu)')
            await this.screenshot(`form_never_rendered_${countrySlug}_attempt${attempt}`)

            try {
              const html     = await this.page.content()
              const htmlPath = path.join(SCREENSHOT_DIR, `${Date.now()}_form_never_rendered_${countrySlug}.html`)
              fs.writeFileSync(htmlPath, html, 'utf8')
              await this.logger.info(`[form] HTML dump: ${htmlPath}`)
            } catch (_) {}

            if (attempt === 2) { this._loginFailed = true; return false }
            continue
          }
        }

        // 5-E. Input var → email selector ara
        foundEmailSel = await this._findSelector(EMAIL_SELECTOR_LIST)
        if (foundEmailSel) {
          await this.logger.info(`[form] ✓ Email selector bulundu: "${foundEmailSel}"`)
        } else {
          // 5-F. Reload dene
          await this.logger.warning('[form] Email selector bulunamadı — sayfa yenileniyor...')
          await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
          try {
            await this.page.waitForLoadState('networkidle', { timeout: 12000 })
          } catch (_) {}
          const reloadCookie = await this._acceptCookies()
          if (reloadCookie.closed) {
            await this.logger.info(`[cookie] Reload sonrası çerez popup kapatıldı — "${reloadCookie.via}"`)
          }
          await this.page.waitForTimeout(2000)
          await this.screenshot('01b_after_reload')
          inputCount = await this._diagnoseDom('reload-sonrasi')

          foundEmailSel = await this._findSelector(EMAIL_SELECTOR_LIST)
          if (foundEmailSel) {
            await this.logger.info(`[form] ✓ Reload sonrası email selector bulundu: "${foundEmailSel}"`)
          } else {
            // 5-G. Hâlâ yok → iframe tara + kesin teşhis
            await this.logger.warning('[form] Reload sonrası da bulunamadı — iframe taranıyor...')
            await this.screenshot(`form_not_found_${countrySlug}_attempt${attempt}`)

            try {
              const html     = await this.page.content()
              const htmlPath = path.join(SCREENSHOT_DIR, `${Date.now()}_form_notfound_${countrySlug}.html`)
              fs.writeFileSync(htmlPath, html, 'utf8')
              await this.logger.info(`[form] HTML dump: ${htmlPath}`)
            } catch (_) {}

            const frames = this.page.frames()
            await this.logger.info(`[form] Toplam frame sayısı: ${frames.length}`)

            for (const frame of frames) {
              const fUrl = frame.url()
              await this.logger.info(`[frame] URL: ${fUrl || '(boş)'}`)
              if (!fUrl || fUrl === 'about:blank') continue

              const frameCookie = await this._clickCookieInContext(frame)
              if (frameCookie) {
                await this.logger.info(`[cookie] iframe çerez kapatıldı: "${frameCookie}" — ${fUrl}`)
                await this.page.waitForTimeout(2000)
              }

              const fEmail = await this._findSelector(EMAIL_SELECTOR_LIST, frame)
              if (fEmail) {
                await this.logger.info(`[frame] ✓ Email selector bulundu: "${fEmail}" — frame: ${fUrl}`)
                foundEmailSel = fEmail
                formFrame     = frame
                break
              }
            }

            if (!foundEmailSel) {
              const diagnosis = inputCount > 0
                ? `[form] Login formu render edildi (${inputCount} input) ama email selector eşleşmedi — selector listesi güncellenmeli`
                : `[form] Sayfa hiç login formu üretmedi — VFS API engeli veya render hatası`
              await this.logger.error(diagnosis)
              if (attempt === 2) { this._loginFailed = true; return false }
              continue
            }
          }
        }

        // 5-D. Password selector'ı bul (aynı context'te)
        foundPwSel = await this._findSelector(PASSWORD_SELECTOR_LIST, formFrame)
        if (foundPwSel) {
          await this.logger.info(`[form] ✓ Password selector bulundu: "${foundPwSel}"`)
        } else {
          await this.logger.warning('[form] Password alanı bulunamadı — devam ediliyor.')
        }

        // 5-E. Submit selector'ı bul
        foundSubmitSel = await this._findSelector(SUBMIT_SELECTOR_LIST, formFrame)
        if (foundSubmitSel) {
          await this.logger.info(`[form] ✓ Submit butonu bulundu: "${foundSubmitSel}"`)
        } else {
          await this.logger.warning('[form] Submit butonu bulunamadı — klavye Enter kullanılacak.')
        }

        // ── 5. Form doldur ve giriş yap ───────────────────────
        await this.logger.info('E-posta ve şifre dolduruluyor...')
        const ctx = formFrame ?? this.page

        if (formFrame) {
          await ctx.fill(foundEmailSel, this.account.email)
          await this.page.waitForTimeout(400 + Math.random() * 400)
          if (foundPwSel) await ctx.fill(foundPwSel, this.account.encrypted_password)
        } else {
          await this.humanType(foundEmailSel, this.account.email)
          if (foundPwSel) await this.humanType(foundPwSel, this.account.encrypted_password)
        }
        await this.screenshot('02_login_filled')

        await this.logger.info('Giriş butonuna tıklanıyor...')
        if (foundSubmitSel) {
          await ctx.click(foundSubmitSel)
        } else {
          // Submit butonu yoksa Enter tuşuna bas
          await ctx.press(foundPwSel ?? foundEmailSel, 'Enter')
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
