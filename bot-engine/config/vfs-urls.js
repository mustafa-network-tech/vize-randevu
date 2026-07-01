/**
 * VFS Global Ülke URL Yapılandırması
 *
 * Gerçek URL formatı: https://visa.vfsglobal.com/tur/en/{ülke_kodu}/{sayfa}
 *
 * Her ülke için tam URL'ler ayrı ayrı tanımlanmıştır.
 * String birleştirme kullanılmamaktadır.
 *
 * Doğrulama kaynağı: visa.vfsglobal.com canlı sayfa taraması
 */

const VFS_COUNTRY_CONFIG = {

  hollanda: {
    label:       'Hollanda (Netherlands)',
    login:       'https://visa.vfsglobal.com/tur/en/nld/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/nld/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/nld',
  },

  italya: {
    label:       'İtalya (Italy)',
    login:       'https://visa.vfsglobal.com/tur/en/ita/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/ita/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/ita',
  },

  ispanya: {
    label:       'İspanya (Spain)',
    login:       'https://visa.vfsglobal.com/tur/en/esp/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/esp/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/esp',
  },

  almanya: {
    label:       'Almanya (Germany)',
    login:       'https://visa.vfsglobal.com/tur/en/deu/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/deu/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/deu',
  },

  fransa: {
    label:       'Fransa (France)',
    login:       'https://visa.vfsglobal.com/tur/en/fra/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/fra/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/fra',
  },

  avusturya: {
    label:       'Avusturya (Austria)',
    login:       'https://visa.vfsglobal.com/tur/en/aut/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/aut/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/aut',
  },

  belcika: {
    label:       'Belçika (Belgium)',
    login:       'https://visa.vfsglobal.com/tur/en/bel/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/bel/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/bel',
  },

  isvicre: {
    label:       'İsviçre (Switzerland)',
    login:       'https://visa.vfsglobal.com/tur/en/che/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/che/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/che',
  },

  yunanistan: {
    label:       'Yunanistan (Greece)',
    login:       'https://visa.vfsglobal.com/tur/en/grc/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/grc/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/grc',
  },

  polonya: {
    label:       'Polonya (Poland)',
    login:       'https://visa.vfsglobal.com/tur/en/pol/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/pol/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/pol',
  },

  portekiz: {
    label:       'Portekiz (Portugal)',
    login:       'https://visa.vfsglobal.com/tur/en/prt/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/prt/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/prt',
  },

  cekya: {
    label:       'Çekya (Czech Republic)',
    login:       'https://visa.vfsglobal.com/tur/en/cze/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/cze/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/cze',
  },

  danimarka: {
    label:       'Danimarka (Denmark)',
    login:       'https://visa.vfsglobal.com/tur/en/dnk/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/dnk/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/dnk',
  },

  isvec: {
    label:       'İsveç (Sweden)',
    login:       'https://visa.vfsglobal.com/tur/en/swe/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/swe/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/swe',
  },

  norvec: {
    label:       'Norveç (Norway)',
    login:       'https://visa.vfsglobal.com/tur/en/nor/login',
    appointment: 'https://visa.vfsglobal.com/tur/en/nor/book-an-appointment',
    home:        'https://visa.vfsglobal.com/tur/en/nor',
  },

}

/**
 * Türkçe karakter normalize — JS toLowerCase() İ→i hatası için
 */
function normalizeKey(str) {
  return (str ?? '')
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/Ş/g, 'ş').replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü').replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase().trim()
    .replace(/belçika/g,         'belcika')
    .replace(/isviçre/g,         'isvicre')
    .replace(/çekya/g,           'cekya')
    .replace(/çek cumhuriyeti/g, 'cekya')
    .replace(/isveç/g,           'isvec')
    .replace(/norveç/g,          'norvec')
}

/**
 * Ülke adından URL yapılandırmasını döndürür.
 * Bulunamazsa null + console.warn.
 */
function getVfsConfig(countryName) {
  const key    = normalizeKey(countryName)
  const config = VFS_COUNTRY_CONFIG[key] ?? null

  if (!config) {
    console.warn(
      `\x1b[33m[vfs-config] Ülke yapılandırması bulunamadı: "${countryName}" → normalize: "${key}"\x1b[0m`
    )
    console.warn(
      `\x1b[2m[vfs-config] Tanımlı ülkeler: ${Object.keys(VFS_COUNTRY_CONFIG).join(', ')}\x1b[0m`
    )
  }

  return config
}

/**
 * Açılan sayfanın geçerli bir VFS login sayfası olup olmadığını doğrular.
 *
 * @param {string} url      - page.url()
 * @param {string} title    - await page.title()
 * @param {string} content  - await page.content()  (opsiyonel)
 * @returns {{ valid: boolean, reason: string, isIpBlock: boolean }}
 */
function validateLoginPage(url, title, content = '') {
  const u = (url     ?? '').toLowerCase()
  const t = (title   ?? '').toLowerCase()
  const c = (content ?? '').toLowerCase()

  // ── İçerik tabanlı IP/bot engeli (JSON hata cevabı) ────────────────
  // VFS 403201, 403, 429 gibi JSON yanıtlar döndürür
  if (
    c.includes('"code": "403') ||
    c.includes('"code":"403') ||
    c.includes('"code": "429') ||
    c.includes('"code":"429') ||
    c.includes('"code": "401') ||
    c.includes('"code":"401')
  ) {
    const codeMatch = content.match(/"code"\s*:\s*"(\d+)"/)
    const code = codeMatch ? codeMatch[1] : '40x'
    return { valid: false, isIpBlock: true, reason: `VFS API engeli: HTTP ${code} — IP engeli veya oran sınırı` }
  }

  // ── IP engeli — başlıkta kontrol ────────────────────────────────────
  if (
    t.includes('unable to progress') ||
    t.includes('try again in one hour') ||
    t.includes('one hour') ||
    t.includes('disconnected from a vpn') ||
    t.includes('cleared your cache')
  ) {
    return { valid: false, isIpBlock: true, reason: 'IP engeli: VFS "1 saat bekleyin" mesajı gösteriyor' }
  }

  // ── URL tabanlı kontroller ───────────────────────────────────────────
  if (u.includes('page-not-found')) {
    return { valid: false, isIpBlock: true, reason: 'URL page-not-found içeriyor — IP engeli veya geçersiz rota' }
  }
  if (u.includes('/error') || u.includes('/blocked')) {
    return { valid: false, isIpBlock: false, reason: 'URL hata/engel içeriyor' }
  }

  // ── Başlık tabanlı kontroller ────────────────────────────────────────
  if (t.includes('page not found') || t.includes('404')) {
    return { valid: false, isIpBlock: false, reason: 'Sayfa bulunamadı (404)' }
  }
  if (t.includes('access denied') || t.includes('forbidden')) {
    return { valid: false, isIpBlock: true, reason: 'Erişim engellendi (403)' }
  }

  return { valid: true, isIpBlock: false, reason: 'OK' }
}

/**
 * Sayfa içeriğinde "Session Expired or Invalid" olup olmadığını kontrol eder.
 * URL, başlık veya HTML içeriğine bakılır.
 */
function isSessionExpired(url, title, content) {
  const u = (url     ?? '').toLowerCase()
  const t = (title   ?? '').toLowerCase()
  const c = (content ?? '').toLowerCase()

  return (
    u.includes('session-expired') ||
    u.includes('session_expired') ||
    t.includes('session expired') ||
    t.includes('session invalid') ||
    c.includes('session expired or invalid') ||
    c.includes('your session has expired') ||
    c.includes('session has expired') ||
    c.includes('invalid session') ||
    c.includes('oturum süresi doldu') ||
    c.includes('oturum geçersiz')
  )
}

module.exports = { getVfsConfig, validateLoginPage, isSessionExpired, normalizeKey, VFS_COUNTRY_CONFIG }
