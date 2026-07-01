const { getSupabase }           = require('./supabase')
const { VfsPlaywrightClient }   = require('./vfs-playwright-client')
const { createLogger }          = require('./logger')
const { bumpMetric }            = require('./metrics')
const { notifyAppointmentFound, notifyBotError, notifyBotStopped, sendTelegram } = require('./notifier')

const MAX_CONSECUTIVE_ERRORS = 5
const runningBots = new Set()

const C = { cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', dim: '\x1b[2m', reset: '\x1b[0m' }

/** Şu an işleme alınan bot sayısı (heartbeat için) */
function getRunningCount() {
  return runningBots.size
}

async function runBot(bot) {
  if (runningBots.has(bot.id)) return

  const supabase = getSupabase()
  const logger   = createLogger(bot.id, bot.name)
  const account  = bot.visa_accounts

  runningBots.add(bot.id)

  // Son çalışma zamanını güncelle
  await supabase.from('bots').update({ last_run: new Date().toISOString() }).eq('id', bot.id)

  console.log(`\n${C.cyan}${'─'.repeat(60)}${C.reset}`)
  console.log(`${C.cyan}▶ Bot döngüsü başlıyor: ${bot.name}${C.reset}`)
  console.log(`${C.dim}  Hesap : ${account?.email ?? '?'}`)
  console.log(`  Ülke  : ${account?.country ?? '?'}`)
  console.log(`  ID    : ${bot.id}${C.reset}`)
  console.log(`${C.cyan}${'─'.repeat(60)}${C.reset}\n`)

  await logger.info(`Bot döngüsü başlatıldı — hesap: ${account?.email ?? '?'}, ülke: ${account?.country ?? '?'}`)

  const notifyFn = async (title, message) => {
    await sendTelegram(`<b>${title}</b>\n${message}`)
    const { error: nErr } = await supabase.from('notifications').insert({
      user_id: bot.user_id, type: 'warning', title, message, is_read: false,
    })
    if (nErr) console.error(`${C.red}[runner] Bildirim insert hatası:${C.reset}`, nErr.message)
  }

  const client = new VfsPlaywrightClient(account, logger, notifyFn)

  try {
    // ── 1. Tarayıcı başlat ──────────────────────────────
    await logger.info('Playwright tarayıcısı başlatılıyor...')
    await client.launch()
    await logger.info('Tarayıcı başlatıldı.')

    // ── 2. Slot kontrolü (login + sayfa açma + parse) ──
    await logger.info(`VFS giriş deneniyor: ${account?.email ?? '?'}`)
    const slots = await client.checkSlots()

    // ── 3. Login / IP engeli / genel hata metrikleri ───
    if (client._loginFailed) {
      await bumpMetric(bot.id, 'login_fail')
      await logger.warning('Login başarısız — metrik kaydedildi.')
    }

    if (client._ipBlocked) {
      await bumpMetric(bot.id, 'ip_blocks')
      const unblockAt     = Date.now() + 65 * 60 * 1000
      const unblockTime   = new Date(unblockAt).toLocaleTimeString('tr-TR')
      const nextRetryAtIso = new Date(unblockAt).toISOString()

      console.log(`${C.red}[runner] ${bot.name} IP engeli — ${unblockTime}'e kadar askıya alındı.${C.reset}`)
      await logger.warning(`IP engeli: bot ${unblockTime}'e kadar duraklatıldı. Proxy kullanmanız önerilir.`)

      await supabase.from('bots').update({
        status: 'paused',
        next_retry_at: nextRetryAtIso,
      }).eq('id', bot.id)

      runningBots.delete(bot.id)
      await client.close()
      return
    }

    if (client._loginSuccess) {
      await bumpMetric(bot.id, 'login_success')
    }

    if (client._slotCheckSuccess) {
      await bumpMetric(bot.id, 'slot_checks')
    }

    if (client._captchaEncountered) {
      await bumpMetric(bot.id, 'captcha_events')
    }

    // ── 4. Randevu bulunamadı ──────────────────────────
    if (slots.length === 0) {
      await logger.info('Randevu bulunamadı — bir sonraki döngüde tekrar denenecek.')
      runningBots.delete(bot.id)
      await client.close()
      return
    }

    // ── 5. Randevu bulundu ─────────────────────────────
    await bumpMetric(bot.id, 'appointments_found')
    await logger.success(`${slots.length} randevu slotu bulundu! İşleme alınıyor...`)

    // ── 6. DB'ye kaydet ────────────────────────────────
    const rows = slots.map(slot => ({
      bot_id:           bot.id,
      country:          account?.country ?? 'Bilinmiyor',
      city:             account?.city ?? null,
      center:           slot.center ?? account?.visa_center ?? null,
      visa_type:        account?.visa_type ?? null,
      appointment_date: slot.date,
      appointment_time: slot.time ?? null,
      status:           'available',
    }))

    console.log(`${C.dim}[runner] appointments upsert — ${rows.length} kayıt...${C.reset}`)
    const { error: upsertErr } = await supabase.from('appointments').upsert(rows, {
      onConflict: 'bot_id,appointment_date,appointment_time',
      ignoreDuplicates: true,
    })
    if (upsertErr) {
      console.error(`${C.red}[runner] appointments upsert HATA:${C.reset}`, upsertErr.message)
      await logger.error(`Randevu kayıt hatası: ${upsertErr.message}`)
    } else {
      console.log(`${C.green}[runner] appointments upsert OK${C.reset}`)
      await logger.success(`${rows.length} randevu appointments tablosuna kaydedildi.`)
    }

    // ── 7. Bildirim ────────────────────────────────────
    for (const slot of slots) {
      await notifyAppointmentFound(
        bot.user_id, bot.name, account?.country,
        slot.date, slot.time, slot.center ?? account?.visa_center,
      )
    }

    // ── 8. Otomatik rezervasyon ────────────────────────
    if (bot.auto_book) {
      await logger.info('Otomatik rezervasyon etkin — başvuran bilgileri sorgulanıyor...')
      const { data: applicants, error: appErr } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', bot.user_id)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)

      if (appErr) {
        console.error(`${C.red}[runner] applicants sorgu hatası:${C.reset}`, appErr.message)
        await logger.error(`Başvuran sorgu hatası: ${appErr.message}`)
      } else if (!applicants || applicants.length === 0) {
        await logger.warning('Başvuran bilgisi bulunamadı — /applicants sayfasından ekleyin.')
        await notifyFn('⚠️ Başvuran Bilgisi Eksik',
          `${bot.name} botu randevu buldu ama kayıtlı başvuran yok.\nPanelden ekleyin.`)
      } else {
        const applicant = applicants[0]
        await logger.info(`Başvuran bulundu: ${applicant.full_name} — rezervasyon deneniyor...`)
        const result = await client.bookAppointment(slots[0], applicant)

        if (result.success) {
          await supabase.from('appointments')
            .update({ status: 'booked' })
            .eq('bot_id', bot.id)
            .eq('appointment_date', slots[0].date)

          const successMsg = `${applicant.full_name} için ${slots[0].date} ${slots[0].time ?? ''} randevusu alındı.${result.reference ? ` Ref: ${result.reference}` : ''}`
          await logger.success(`Rezervasyon başarılı! ${successMsg}`)

          await supabase.from('notifications').insert({
            user_id: bot.user_id, type: 'success',
            title: `✅ Randevu Alındı! — ${account?.country}`,
            message: successMsg, is_read: false,
          })
          await sendTelegram(`<b>✅ RANDEVU ALINDI!</b>\nKişi: ${applicant.full_name}\nÜlke: ${account?.country}\nTarih: ${slots[0].date} ${slots[0].time ?? ''}${result.reference ? `\nRef: ${result.reference}` : ''}`)
        } else {
          await logger.error(`Rezervasyon başarısız: ${result.error ?? 'Bilinmeyen hata'}`)
        }
      }
    }
  } catch (err) {
    console.error(`${C.red}[runner] ❌ Kritik hata:${C.reset}`, err.message)
    await logger.error(`Kritik hata: ${err.message}`)
    await notifyBotError(bot.user_id, bot.name, err.message)

    const { data: currentBot } = await supabase.from('bots').select('error_count').eq('id', bot.id).single()
    const errorCount = (currentBot?.error_count ?? 0) + 1
    await supabase.from('bots').update({ error_count: errorCount }).eq('id', bot.id)

    if (errorCount >= MAX_CONSECUTIVE_ERRORS) {
      await supabase.from('bots').update({ status: 'error', error_count: 0 }).eq('id', bot.id)
      await notifyBotStopped(bot.user_id, bot.name, `${MAX_CONSECUTIVE_ERRORS} ardı ardına hata — bot durduruldu.`)
      await logger.error(`Bot ${MAX_CONSECUTIVE_ERRORS} hata sonrası durduruldu.`)
    }
  } finally {
    await client.close()
    runningBots.delete(bot.id)
    console.log(`\n${C.dim}▶ Bot döngüsü tamamlandı: ${bot.name}${C.reset}\n`)
  }
}

let _firstCycle = true

async function runCycle() {
  const supabase = getSupabase()

  // ── IP engeli süresi dolan duraklatılmış botları otomatik devam ettir ──────
  const nowIso = new Date().toISOString()
  const { data: resumable } = await supabase
    .from('bots')
    .select('id, name')
    .eq('status', 'paused')
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', nowIso)

  if (resumable && resumable.length > 0) {
    for (const b of resumable) {
      console.log(`${C.green}[runner] ${b.name} IP engeli süresi doldu → tekrar çalışıyor${C.reset}`)
      await supabase.from('bots').update({ status: 'running', next_retry_at: null }).eq('id', b.id)
    }
  }

  // ── Çalışan botları getir ─────────────────────────────────────────────────
  const { data: bots, error } = await supabase
    .from('bots')
    .select('*, visa_accounts(email, encrypted_password, country, city, visa_center, visa_type, provider)')
    .eq('status', 'running')

  if (error) { console.error(`\x1b[31m[runner] Bot listesi alınamadı:\x1b[0m`, error.message); return }
  if (!bots || bots.length === 0) {
    process.stdout.write(`\r\x1b[2m[${new Date().toLocaleTimeString('tr-TR')}] Çalışan bot yok — bekleniyor...\x1b[0m`)
    return
  }

  // İlk döngüde aktif botların ülke adlarını göster (debug)
  if (_firstCycle) {
    _firstCycle = false
    console.log(`\n\x1b[36m[runner] Aktif botlar ve ülke isimleri:\x1b[0m`)
    bots.forEach(b => {
      const country = b.visa_accounts?.country ?? 'YOK'
      console.log(`  • ${b.name} → ülke: "${country}" → normalize: "${country.replace(/İ/g,'i').replace(/I/g,'i').toLowerCase().trim()}"`)
    })
    console.log()
  }

  const now = Date.now()
  const pending = bots.filter(bot => {
    const intervalMs = (bot.check_interval ?? 60) * 1000
    const lastRun    = bot.last_run ? new Date(bot.last_run).getTime() : 0
    return now - lastRun >= intervalMs
  })

  if (pending.length === 0) return

  console.log(`\n\x1b[2m[runner] ${pending.length} bot sırayla çalıştırılacak (IP engeli önlemi)\x1b[0m`)

  for (let i = 0; i < pending.length; i++) {
    const bot = pending[i]
    await runBot(bot)
    if (i < pending.length - 1) {
      const wait = 5000 + Math.floor(Math.random() * 5000)
      console.log(`\x1b[2m[runner] Sonraki bot için ${(wait / 1000).toFixed(1)}s bekleniyor...\x1b[0m`)
      await new Promise(r => setTimeout(r, wait))
    }
  }
}

module.exports = { runCycle, runBot, getRunningCount }
