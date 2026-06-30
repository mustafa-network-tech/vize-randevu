const { getSupabase }           = require('./supabase')
const { VfsPlaywrightClient }   = require('./vfs-playwright-client')
const { createLogger }          = require('./logger')
const { notifyAppointmentFound, notifyBotError, notifyBotStopped, sendTelegram } = require('./notifier')

const MAX_CONSECUTIVE_ERRORS = 5
const runningBots = new Set()

/**
 * Tek bir botu çalıştırır:
 * 1. Playwright ile VFS'ye giriş yap
 * 2. Slotları kontrol et
 * 3. Slot bulunduysa DB'ye yaz ve bildirim gönder
 * 4. auto_book = true ise başvuran bilgileriyle randevu al
 */
async function runBot(bot) {
  if (runningBots.has(bot.id)) return

  const supabase  = getSupabase()
  const logger    = createLogger(bot.id)
  const account   = bot.visa_accounts

  runningBots.add(bot.id)
  await supabase.from('bots').update({ last_run: new Date().toISOString() }).eq('id', bot.id)
  await logger.info(`Bot başlatıldı: ${bot.name} — ${account?.country ?? '?'} / ${account?.email ?? '?'}`)

  const notifyFn = async (title, message) => {
    await sendTelegram(`<b>${title}</b>\n${message}`)
    await supabase.from('notifications').insert({ user_id: bot.user_id, type: 'warning', title, message, is_read: false })
  }

  const client = new VfsPlaywrightClient(account, logger, notifyFn)

  try {
    await client.launch()
    const slots = await client.checkSlots()

    if (slots.length === 0) {
      runningBots.delete(bot.id)
      await client.close()
      return
    }

    // Bulunan slotları DB'ye kaydet
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

    await supabase.from('appointments').upsert(rows, {
      onConflict: 'bot_id,appointment_date,appointment_time',
      ignoreDuplicates: true,
    })

    // Bildirim gönder
    for (const slot of slots) {
      await notifyAppointmentFound(bot.user_id, bot.name, account?.country, slot.date, slot.time, slot.center ?? account?.visa_center)
    }

    // Otomatik rezervasyon
    if (bot.auto_book) {
      await logger.info('Otomatik rezervasyon etkin — başvuran bilgileri alınıyor...')

      const { data: applicants } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', bot.user_id)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)

      if (!applicants || applicants.length === 0) {
        await logger.warning('Otomatik rezervasyon için başvuran bilgisi bulunamadı. /applicants sayfasından ekleyin.')
        await notifyFn(
          '⚠️ Başvuran Bilgisi Eksik',
          `${bot.name} botu randevu buldu ama başvuran bilgisi kayıtlı değil.\nPanelden başvuran ekleyin.`
        )
      } else {
        const applicant = applicants[0]
        const result = await client.bookAppointment(slots[0], applicant)

        if (result.success) {
          // Randevuyu "booked" olarak işaretle
          await supabase.from('appointments')
            .update({ status: 'booked' })
            .eq('bot_id', bot.id)
            .eq('appointment_date', slots[0].date)

          await supabase.from('notifications').insert({
            user_id: bot.user_id,
            type: 'success',
            title: `✅ Randevu Alındı! — ${account?.country}`,
            message: `${applicant.full_name} için ${slots[0].date} ${slots[0].time ?? ''} tarihli randevu başarıyla alındı.${result.reference ? ` Referans: ${result.reference}` : ''}`,
            is_read: false,
          })

          await sendTelegram(
            `<b>✅ RANDEVU ALINDI!</b>\n` +
            `Kişi: ${applicant.full_name}\n` +
            `Ülke: ${account?.country}\n` +
            `Tarih: ${slots[0].date} ${slots[0].time ?? ''}\n` +
            (result.reference ? `Referans: ${result.reference}` : '')
          )
        }
      }
    }
  } catch (err) {
    await logger.error(`Beklenmedik hata: ${err.message}`)
    await notifyBotError(bot.user_id, bot.name, err.message)

    // Ardı ardına hata sayacı
    const { data: currentBot } = await supabase.from('bots').select('error_count').eq('id', bot.id).single()
    const errorCount = (currentBot?.error_count ?? 0) + 1
    await supabase.from('bots').update({ error_count: errorCount }).eq('id', bot.id)

    if (errorCount >= MAX_CONSECUTIVE_ERRORS) {
      await supabase.from('bots').update({ status: 'error', error_count: 0 }).eq('id', bot.id)
      await notifyBotStopped(bot.user_id, bot.name, `${MAX_CONSECUTIVE_ERRORS} ardı ardına hata oluştu — bot durduruldu.`)
    }
  } finally {
    await client.close()
    runningBots.delete(bot.id)
  }
}

/**
 * Tüm çalışan botların bir döngü turunu gerçekleştirir.
 */
async function runCycle() {
  const supabase = getSupabase()
  const { data: bots, error } = await supabase
    .from('bots')
    .select('*, visa_accounts(email, encrypted_password, country, city, visa_center, visa_type, provider)')
    .eq('status', 'running')

  if (error) { console.error('[runner] Bot listesi alınamadı:', error.message); return }
  if (!bots || bots.length === 0) return

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
