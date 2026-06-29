const axios = require('axios')
const { getSupabase } = require('./supabase')

/**
 * Telegram üzerinden mesaj gönderir.
 */
async function sendTelegram(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    })
  } catch (err) {
    console.error('[notifier] Telegram hatası:', err.message)
  }
}

/**
 * Supabase notifications tablosuna kayıt ekler ve Telegram'a bildirim gönderir.
 */
async function notify(userId, type, title, message) {
  const supabase = getSupabase()
  await supabase.from('notifications').insert({ user_id: userId, type, title, message, is_read: false })
  await sendTelegram(`<b>${title}</b>\n${message}`)
}

/**
 * Bulunan randevu için bildirim gönderir.
 */
async function notifyAppointmentFound(userId, botName, country, date, time, center) {
  const title = `🟢 Randevu Bulundu! — ${country}`
  const message = [
    `<b>Bot:</b> ${botName}`,
    `<b>Ülke:</b> ${country}`,
    `<b>Merkez:</b> ${center ?? 'Bilinmiyor'}`,
    `<b>Tarih:</b> ${date}`,
    `<b>Saat:</b> ${time ?? 'Belirtilmemiş'}`,
  ].join('\n')
  await notify(userId, 'appointment', title, message)
}

/**
 * Bot hatası bildirimi.
 */
async function notifyBotError(userId, botName, errorMessage) {
  const title = `🔴 Bot Hatası — ${botName}`
  await notify(userId, 'error', title, `Hata: ${errorMessage}`)
}

/**
 * Bot durduruldu bildirimi.
 */
async function notifyBotStopped(userId, botName, reason) {
  const title = `⚠️ Bot Durdu — ${botName}`
  await notify(userId, 'warning', title, reason ?? 'Bot beklenmedik şekilde durdu.')
}

module.exports = { notify, notifyAppointmentFound, notifyBotError, notifyBotStopped, sendTelegram }
