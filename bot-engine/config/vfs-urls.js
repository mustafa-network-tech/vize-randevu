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
 * @returns {{ valid: boolean, reason: string }}
 */
function validateLoginPage(url, title) {
  const u = (url   ?? '').toLowerCase()
  const t = (title ?? '').toLowerCase()

  // IP engeli — başlıkta kontrol (URL'den önce, daha spesifik)
  if (
    t.includes('unable to progress') ||
    t.includes('try again in one hour') ||
    t.includes('one hour') ||
    t.includes('disconnected from a vpn') ||
    t.includes('cleared your cache')
  ) {
    return { valid: false, reason: 'IP engeli: VFS "1 saat bekleyin" mesajı gösteriyor' }
  }

  if (u.includes('page-not-found')) {
    return { valid: false, reason: 'URL page-not-found içeriyor — IP engeli veya geçersiz rota' }
  }
  if (u.includes('/error') || u.includes('/blocked')) {
    return { valid: false, reason: 'URL hata/engel içeriyor' }
  }
  if (t.includes('page not found') || t.includes('404')) {
    return { valid: false, reason: 'Sayfa bulunamadı (404)' }
  }
  if (t.includes('access denied') || t.includes('forbidden')) {
    return { valid: false, reason: 'Erişim engellendi (403)' }
  }

  return { valid: true, reason: 'OK' }
}

module.exports = { getVfsConfig, validateLoginPage, normalizeKey, VFS_COUNTRY_CONFIG }
