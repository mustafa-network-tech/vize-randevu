/**
 * Playwright Debug Yardımcısı
 *
 * Timeout veya hata oluştuğunda tam teşhis bilgisi toplar:
 *  - Mevcut URL
 *  - Sayfa başlığı
 *  - Tam sayfa ekran görüntüsü
 *  - Ham HTML (dosyaya)
 *  - Konsol hataları
 *  - Network response kodları
 *  - Sayfadaki tüm input/button elementleri
 *  - Belirtilen selektörlerin var olup olmadığı
 */

const fs   = require('fs')
const path = require('path')

const DEBUG_DIR = path.join(__dirname, '..', 'debug-dumps')
if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true })

const C = {
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  dim:    '\x1b[2m',
  reset:  '\x1b[0m',
}

/**
 * Bir Playwright page nesnesini izlemeye başlar.
 * Konsol hatalarını ve network cevaplarını memory'de tutar.
 *
 * @param {import('playwright').Page} page
 * @returns {{ consoleErrors: string[], networkResponses: {url:string, status:number}[], stop: Function }}
 */
function attachPageListeners(page) {
  const consoleErrors    = []
  const networkResponses = []

  const onConsole = (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type().toUpperCase()}] ${msg.text()}`)
    }
  }

  const onResponse = (res) => {
    networkResponses.push({ url: res.url(), status: res.status() })
  }

  page.on('console',  onConsole)
  page.on('response', onResponse)

  return {
    consoleErrors,
    networkResponses,
    stop: () => {
      page.off('console',  onConsole)
      page.off('response', onResponse)
    },
  }
}

/**
 * Tam teşhis dökümü alır. Timeout veya beklenmedik hata anında çağrılır.
 *
 * @param {import('playwright').Page} page
 * @param {string} label   - Dump'a verilecek etiket (örn: "login_timeout")
 * @param {string[]} consoleErrors
 * @param {{url:string, status:number}[]} networkResponses
 * @param {string[]} [selectorsToCheck]  - Varlığı doğrulanacak selektörler
 * @returns {Promise<string>}  Dump klasörü yolu
 */
async function captureDump(page, label, consoleErrors = [], networkResponses = [], selectorsToCheck = []) {
  const ts      = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dumpDir = path.join(DEBUG_DIR, `${ts}_${label}`)
  fs.mkdirSync(dumpDir, { recursive: true })

  const sep = `${C.yellow}${'═'.repeat(60)}${C.reset}`
  console.log(`\n${sep}`)
  console.log(`${C.yellow}🔍 PLAYWRIGHT DEBUG DUMP — ${label}${C.reset}`)
  console.log(sep)

  // ── 1. URL & Başlık ──────────────────────────────────────
  let currentUrl   = '(alınamadı)'
  let pageTitle    = '(alınamadı)'
  try {
    currentUrl = page.url()
    pageTitle  = await page.title()
  } catch (_) {}

  console.log(`${C.cyan}URL   :${C.reset} ${currentUrl}`)
  console.log(`${C.cyan}Başlık:${C.reset} ${pageTitle}`)

  fs.writeFileSync(path.join(dumpDir, 'info.txt'),
    `URL    : ${currentUrl}\nBaslik : ${pageTitle}\nZaman  : ${new Date().toLocaleString('tr-TR')}\nLabel  : ${label}\n`
  )

  // ── 2. Tam sayfa screenshot ──────────────────────────────
  try {
    const ssPath = path.join(dumpDir, 'screenshot_full.png')
    await page.screenshot({ path: ssPath, fullPage: true })
    console.log(`${C.green}✓ Screenshot:${C.reset} ${ssPath}`)
  } catch (err) {
    console.log(`${C.red}✗ Screenshot alınamadı: ${err.message}${C.reset}`)
  }

  // ── 3. HTML kaydı ────────────────────────────────────────
  try {
    const html     = await page.content()
    const htmlPath = path.join(dumpDir, 'page.html')
    fs.writeFileSync(htmlPath, html, 'utf8')
    console.log(`${C.green}✓ HTML kaydedildi:${C.reset} ${htmlPath} (${(html.length / 1024).toFixed(1)} KB)`)
  } catch (err) {
    console.log(`${C.red}✗ HTML alınamadı: ${err.message}${C.reset}`)
  }

  // ── 4. Konsol hataları ───────────────────────────────────
  if (consoleErrors.length > 0) {
    console.log(`\n${C.red}Console hataları (${consoleErrors.length}):${C.reset}`)
    consoleErrors.forEach(e => console.log(`  ${C.dim}${e}${C.reset}`))
    fs.writeFileSync(path.join(dumpDir, 'console_errors.txt'), consoleErrors.join('\n'), 'utf8')
  } else {
    console.log(`${C.green}✓ Console hatası yok${C.reset}`)
  }

  // ── 5. Network response kodları ──────────────────────────
  const failedRequests = networkResponses.filter(r => r.status >= 400)
  if (failedRequests.length > 0) {
    console.log(`\n${C.red}Başarısız Network İstekleri (${failedRequests.length}):${C.reset}`)
    failedRequests.slice(-20).forEach(r =>
      console.log(`  ${C.dim}[${r.status}] ${r.url.slice(0, 100)}${C.reset}`)
    )
  } else {
    console.log(`${C.green}✓ Network hata yok (${networkResponses.length} istek)${C.reset}`)
  }
  fs.writeFileSync(
    path.join(dumpDir, 'network.txt'),
    networkResponses.slice(-100).map(r => `[${r.status}] ${r.url}`).join('\n'),
    'utf8'
  )

  // ── 6. Sayfadaki input / button elementleri ──────────────
  try {
    const elements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(el => ({
        tag: 'input',
        type:            el.type                              || null,
        name:            el.name                             || null,
        id:              el.id                               || null,
        placeholder:     el.placeholder                      || null,
        formcontrolname: el.getAttribute('formcontrolname')  || null,
        ngModel:         el.getAttribute('ng-model')         || null,
        visible:         el.offsetParent !== null,
      }))

      const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(el => ({
        tag:     el.tagName.toLowerCase(),
        type:    el.type        || null,
        text:    el.textContent?.trim().slice(0, 60) || null,
        classes: el.className   || null,
        visible: el.offsetParent !== null,
      }))

      return { inputs, buttons }
    })

    console.log(`\n${C.cyan}Sayfadaki INPUT elementleri (${elements.inputs.length}):${C.reset}`)
    elements.inputs.forEach((el, i) => {
      const visible = el.visible ? C.green + '✓' : C.red + '✗'
      console.log(`  ${i + 1}. ${visible}${C.reset} type="${el.type}" name="${el.name}" id="${el.id}" formcontrolname="${el.formcontrolname}" placeholder="${el.placeholder}"`)
    })

    console.log(`\n${C.cyan}Sayfadaki BUTTON elementleri (${elements.buttons.length}):${C.reset}`)
    elements.buttons.forEach((el, i) => {
      const visible = el.visible ? C.green + '✓' : C.red + '✗'
      console.log(`  ${i + 1}. ${visible}${C.reset} type="${el.type}" text="${el.text}" class="${(el.classes || '').slice(0, 60)}"`)
    })

    fs.writeFileSync(
      path.join(dumpDir, 'elements.json'),
      JSON.stringify(elements, null, 2),
      'utf8'
    )
  } catch (err) {
    console.log(`${C.red}✗ Element listesi alınamadı: ${err.message}${C.reset}`)
  }

  // ── 7. Selector doğrulama ────────────────────────────────
  if (selectorsToCheck.length > 0) {
    console.log(`\n${C.cyan}Selector Doğrulama:${C.reset}`)
    const results = []
    for (const sel of selectorsToCheck) {
      try {
        const count = await page.locator(sel).count()
        const found = count > 0
        console.log(`  ${found ? C.green + '✓' : C.red + '✗'}${C.reset} "${sel}" → ${found ? `${count} eleman bulundu` : 'BULUNAMADI'}`)
        results.push({ selector: sel, found, count })
      } catch (err) {
        console.log(`  ${C.red}✗${C.reset} "${sel}" → HATA: ${err.message}`)
        results.push({ selector: sel, found: false, error: err.message })
      }
    }
    fs.writeFileSync(
      path.join(dumpDir, 'selector_check.json'),
      JSON.stringify(results, null, 2),
      'utf8'
    )
  }

  console.log(`\n${C.dim}Dump klasörü: ${dumpDir}${C.reset}`)
  console.log(sep + '\n')

  return dumpDir
}

module.exports = { attachPageListeners, captureDump }
