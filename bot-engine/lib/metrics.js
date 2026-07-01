/**
 * Bot Metrikleri
 *
 * bots tablosundaki toplam sayaçları ve bot_daily_metrics tablosundaki
 * günlük sayaçları atomik olarak günceller.
 *
 * Kullanım:
 *   const { bumpMetric } = require('./metrics')
 *   await bumpMetric(bot.id, 'login_success')
 */

const { getSupabase } = require('./supabase')

const VALID_FIELDS = [
  'login_success',
  'login_fail',
  'slot_checks',
  'ip_blocks',
  'captcha_events',
  'appointments_found',
]

const C = { dim: '\x1b[2m', red: '\x1b[31m', reset: '\x1b[0m' }

/**
 * Bir bot için hem toplam sayacı hem de bugünkü günlük sayacı 1 artırır.
 * @param {string} botId
 * @param {'login_success'|'login_fail'|'slot_checks'|'ip_blocks'|'captcha_events'|'appointments_found'} field
 */
async function bumpMetric(botId, field) {
  if (!VALID_FIELDS.includes(field)) {
    console.error(`[metrics] Geçersiz metrik alanı: ${field}`)
    return
  }

  const supabase = getSupabase()
  const today = new Date().toISOString().split('T')[0]  // 'YYYY-MM-DD'

  try {
    // ── 1. bots toplam sayacı ─────────────────────────────
    const { data: bot, error: fetchErr } = await supabase
      .from('bots')
      .select(field)
      .eq('id', botId)
      .single()

    if (fetchErr) throw new Error(`bots fetch: ${fetchErr.message}`)
    const currentTotal = (bot ?? {})[field] ?? 0

    const { error: updateErr } = await supabase
      .from('bots')
      .update({ [field]: currentTotal + 1 })
      .eq('id', botId)

    if (updateErr) throw new Error(`bots update: ${updateErr.message}`)

    // ── 2. bot_daily_metrics günlük sayacı ────────────────
    const { data: existing, error: dmFetchErr } = await supabase
      .from('bot_daily_metrics')
      .select('id, ' + field)
      .eq('bot_id', botId)
      .eq('date', today)
      .maybeSingle()

    if (dmFetchErr) throw new Error(`daily_metrics fetch: ${dmFetchErr.message}`)

    if (existing) {
      const { error: dmUpdateErr } = await supabase
        .from('bot_daily_metrics')
        .update({ [field]: (existing[field] ?? 0) + 1 })
        .eq('id', existing.id)
      if (dmUpdateErr) throw new Error(`daily_metrics update: ${dmUpdateErr.message}`)
    } else {
      const { error: dmInsertErr } = await supabase
        .from('bot_daily_metrics')
        .insert({ bot_id: botId, date: today, [field]: 1 })
      if (dmInsertErr) throw new Error(`daily_metrics insert: ${dmInsertErr.message}`)
    }

    console.log(`${C.dim}[metrics] ✓ ${field} +1 (bot: ${botId.slice(0, 8)}...)${C.reset}`)
  } catch (err) {
    console.error(`${C.red}[metrics] bumpMetric hatası (${field}):${C.reset}`, err.message)
  }
}

module.exports = { bumpMetric }
