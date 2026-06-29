const { getSupabase } = require('./supabase')
const { VfsClient } = require('./vfs-client')
const { createLogger } = require('./logger')
const { notifyAppointmentFound, notifyBotError, notifyBotStopped } = require('./notifier')

// Kaç ardı ardına hata olunca bot durdurulsun
const MAX_CONSECUTIVE_ERRORS = 5

// Çalışan botları takip et (tekrar başlatmayı önlemek için)
const runningBots = new Set()

/**
 * Tek bir botu çalıştırır: giriş yap, slotları kontrol et, sonuçları kaydet.
 */
async function runBot(bot) {
  if (runningBots.has(bot.id)) return  // zaten çalışıyor

  const supabase   = getSupabase()
  const logger     = createLogger(bot.id)
  const vfsClient  = new VfsClient(bot.visa_accounts, logger)
  let   errorCount = 0

  runningBots.add(bot.id)

  // Son çalışma zamanını güncelle
  await supabase.from('bots').update({ last_run: new Date().toISOString() }).eq('id', bot.id)

  await logger.info(`Bot başlatıldı: ${bot.name} (${bot.visa_accounts?.country ?? '?'})`)

  try {
    const slots = await vfsClient.checkSlots()

    if (slots.length > 0) {
      // Bulunan randevuları appointments tablosuna yaz
      const appointmentRows = slots.map(slot => ({
        bot_id:           bot.id,
        country:          bot.visa_accounts?.country ?? 'Bilinmiyor',
        city:             bot.visa_accounts?.city ?? null,
        center:           slot.center ?? bot.visa_accounts?.visa_center ?? null,
        visa_type:        bot.visa_accounts?.visa_type ?? null,
        appointment_date: slot.date,
        appointment_time: slot.time ?? null,
        status:           'available',
      }))

      const { error: insertErr } = await supabase.from('appointments').upsert(appointmentRows, {
        onConflict: 'bot_id,appointment_date,appointment_time',
        ignoreDuplicates: true,
      })

      if (!insertErr) {
        for (const slot of slots) {
          await notifyAppointmentFound(
            bot.user_id,
            bot.name,
            bot.visa_accounts?.country,
            slot.date,
            slot.time,
            slot.center ?? bot.visa_accounts?.visa_center,
          )
        }
      }

      // Otomatik rezervasyon açıksa işaretle
      if (bot.auto_book && slots.length > 0) {
        await logger.info('Otomatik rezervasyon etkin — ilk uygun slot rezerve ediliyor...')
        // TODO: VFS rezervasyon POST isteği — ülkeye göre özelleştirin
      }

      errorCount = 0
    }
  } catch (err) {
    errorCount++
    await logger.error(`Çalışma hatası (${errorCount}/${MAX_CONSECUTIVE_ERRORS}): ${err.message}`)
    await notifyBotError(bot.user_id, bot.name, err.message)

    if (errorCount >= MAX_CONSECUTIVE_ERRORS) {
      await supabase.from('bots').update({ status: 'error' }).eq('id', bot.id)
      await notifyBotStopped(bot.user_id, bot.name, `${MAX_CONSECUTIVE_ERRORS} ardı ardına hata — bot durduruldu.`)
      runningBots.delete(bot.id)
      return
    }
  } finally {
    await vfsClient.logout()
    runningBots.delete(bot.id)
  }
}

/**
 * Tüm çalışan botların bir döngü turunu gerçekleştirir.
 * Scheduler bunu periyodik olarak çağırır.
 */
async function runCycle() {
  const supabase = getSupabase()
  const { data: bots, error } = await supabase
    .from('bots')
    .select('*, visa_accounts(email, encrypted_password, country, city, visa_center, visa_type, provider)')
    .eq('status', 'running')

  if (error) {
    console.error('[runner] Bot listesi alınamadı:', error.message)
    return
  }

  if (!bots || bots.length === 0) return

  // Botları paralel çalıştır — her birinin kendi check_interval'ına göre
  const now = Date.now()
  const promises = bots.map(async bot => {
    const intervalMs = (bot.check_interval ?? 60) * 1000
    const lastRun    = bot.last_run ? new Date(bot.last_run).getTime() : 0
    if (now - lastRun >= intervalMs) {
      await runBot(bot)
    }
  })

  await Promise.allSettled(promises)
}

module.exports = { runCycle, runBot }
