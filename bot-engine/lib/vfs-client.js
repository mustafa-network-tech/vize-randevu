/**
 * VFS Global HTTP İstemcisi
 *
 * Bu modül VFS Global portalına HTTP istekleri atarak randevu müsaitliğini
 * kontrol eder. Her ülkenin VFS endpoint'i farklı olabilir — aşağıdaki
 * yapıyı ülkeye göre özelleştirin.
 *
 * Desteklenen sağlayıcılar:
 *  - VFS Global  (provider: 'vfs')
 *  - BLS International (provider: 'bls')
 */

const axios = require('axios')
const { wrapper } = require('axios-cookiejar-support')
const { CookieJar } = require('tough-cookie')

// VFS Global ülke konfigürasyonu
// Her ülke için doğru endpoint ve parametreleri doldurun
const VFS_CONFIGS = {
  italya: {
    baseUrl: 'https://visa.vfsglobal.com',
    countryCode: 'ita',
    missionCode: 'tur',
    loginPath: '/tur/ita/login',
    slotsPath: '/tur/ita/appointment/slots',
  },
  hollanda: {
    baseUrl: 'https://visa.vfsglobal.com',
    countryCode: 'nld',
    missionCode: 'tur',
    loginPath: '/tur/nld/login',
    slotsPath: '/tur/nld/appointment/slots',
  },
  almanya: {
    baseUrl: 'https://visa.vfsglobal.com',
    countryCode: 'deu',
    missionCode: 'tur',
    loginPath: '/tur/deu/login',
    slotsPath: '/tur/deu/appointment/slots',
  },
  fransa: {
    baseUrl: 'https://visa.vfsglobal.com',
    countryCode: 'fra',
    missionCode: 'tur',
    loginPath: '/tur/fra/login',
    slotsPath: '/tur/fra/appointment/slots',
  },
}

const BLS_CONFIGS = {
  italya: {
    baseUrl: 'https://blsspainglobal.com',
    slotsApiUrl: 'https://blsspainglobal.com/Global/api/slots',
  },
}

class VfsClient {
  constructor(account, logger) {
    this.account  = account   // { email, encrypted_password, country, city, visa_type }
    this.logger   = logger
    this.session  = null

    const jar    = new CookieJar()
    this.http    = wrapper(axios.create({
      jar,
      withCredentials: true,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    }))
  }

  getConfig() {
    const key = (this.account.country ?? '').toLowerCase()
    if (this.account.provider === 'bls') return BLS_CONFIGS[key] ?? null
    return VFS_CONFIGS[key] ?? null
  }

  /**
   * VFS portalına giriş yapar ve oturum cookie'sini alır.
   * @returns {Promise<boolean>} Giriş başarılıysa true
   */
  async login() {
    const config = this.getConfig()
    if (!config) {
      await this.logger.error(`${this.account.country} için VFS konfigürasyonu bulunamadı.`)
      return false
    }

    try {
      await this.logger.info(`VFS portalına giriş deneniyor: ${this.account.email}`)

      // 1. Önce ana sayfaya git — CSRF token ve cookie'leri al
      const homePage = await this.http.get(config.baseUrl + config.loginPath)

      // CSRF token'ı HTML'den parse et
      const csrfMatch = homePage.data.match(/name="_token"\s+value="([^"]+)"/)
      const csrfToken = csrfMatch ? csrfMatch[1] : null

      // 2. Login POST isteği
      const loginResp = await this.http.post(
        config.baseUrl + config.loginPath,
        new URLSearchParams({
          email: this.account.email,
          password: this.account.encrypted_password,
          ...(csrfToken && { _token: csrfToken }),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': config.baseUrl + config.loginPath,
            ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
          },
          maxRedirects: 5,
        }
      )

      // Giriş başarısını kontrol et (URL veya sayfa içeriğine göre)
      const loginSuccess =
        loginResp.request?.res?.responseUrl?.includes('/dashboard') ||
        loginResp.data?.includes('logout') ||
        loginResp.status === 200

      if (loginSuccess) {
        await this.logger.success('VFS girişi başarılı.')
        this.session = { loggedIn: true, config }
        return true
      } else {
        await this.logger.error('VFS girişi başarısız — kullanıcı adı veya şifre hatalı olabilir.')
        return false
      }
    } catch (err) {
      await this.logger.error(`VFS giriş hatası: ${err.message}`)
      return false
    }
  }

  /**
   * Mevcut randevu slotlarını kontrol eder.
   * @returns {Promise<Array>} Bulunan randevu dizisi
   */
  async checkSlots() {
    if (!this.session?.loggedIn) {
      const ok = await this.login()
      if (!ok) return []
    }

    const config = this.session.config
    try {
      await this.logger.info(`Randevu slotları kontrol ediliyor: ${this.account.country} / ${this.account.city ?? 'tüm merkezler'}`)

      const resp = await this.http.get(config.baseUrl + config.slotsPath, {
        params: {
          ...(this.account.city && { city: this.account.city }),
          ...(this.account.visa_type && { visaCategory: this.account.visa_type }),
          ...(this.account.visa_center && { vatNumber: this.account.visa_center }),
        },
        headers: { 'Accept': 'application/json, text/html', 'Referer': config.baseUrl },
      })

      const slots = this._parseSlots(resp.data)

      if (slots.length > 0) {
        await this.logger.success(`${slots.length} randevu slotu bulundu!`)
      } else {
        await this.logger.info('Uygun randevu yok.')
      }

      return slots
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await this.logger.warning('Oturum süresi dolmuş, yeniden giriş yapılıyor...')
        this.session = null
        return this.checkSlots()
      }
      await this.logger.error(`Slot kontrol hatası: ${err.message}`)
      return []
    }
  }

  /**
   * API veya HTML yanıtından randevu verilerini parse eder.
   * VFS'nin yanıt formatına göre bu metodu özelleştirin.
   */
  _parseSlots(data) {
    try {
      // JSON yanıt formatı (VFS API)
      if (typeof data === 'object' && data !== null) {
        const slotList = data.slots ?? data.availableSlots ?? data.data ?? []
        return Array.isArray(slotList)
          ? slotList.map(s => ({
              date:   s.appointmentDate ?? s.date ?? s.slotDate,
              time:   s.appointmentTime ?? s.time ?? s.slotTime,
              center: s.centerName ?? s.center ?? this.account.visa_center,
            })).filter(s => s.date)
          : []
      }

      // HTML yanıt — randevu tarihlerini regex ile parse et
      if (typeof data === 'string') {
        const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}-\d{2}-\d{2})/g
        const dates = data.match(datePattern) ?? []
        return dates.slice(0, 10).map(date => ({ date, time: null, center: this.account.visa_center }))
      }
    } catch (e) {
      // parse hatası — boş dizi dön
    }
    return []
  }

  /**
   * Oturumu kapatır.
   */
  async logout() {
    if (!this.session?.loggedIn) return
    try {
      const config = this.session.config
      await this.http.get(config.baseUrl + '/logout')
      this.session = null
    } catch (_) {}
  }
}

module.exports = { VfsClient }
