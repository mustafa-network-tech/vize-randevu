const { getSupabase } = require('./supabase')

const LEVELS = { info: 0, success: 1, warning: 2, error: 3 }
const MIN_LEVEL = LEVELS[process.env.ENGINE_LOG_LEVEL ?? 'info'] ?? 0

function timestamp() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

const COLORS = { info: '\x1b[36m', success: '\x1b[32m', warning: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' }

async function log(botId, level, message) {
  if (LEVELS[level] < MIN_LEVEL) return
  const color = COLORS[level] ?? ''
  console.log(`${color}[${timestamp()}] [${level.toUpperCase()}]${COLORS.reset} ${message}`)
  try {
    const supabase = getSupabase()
    await supabase.from('bot_logs').insert({ bot_id: botId, level, message })
  } catch (err) {
    console.error('[logger] DB log hatası:', err.message)
  }
}

const createLogger = (botId) => ({
  info:    (msg) => log(botId, 'info', msg),
  success: (msg) => log(botId, 'success', msg),
  warning: (msg) => log(botId, 'warning', msg),
  error:   (msg) => log(botId, 'error', msg),
})

module.exports = { createLogger, log }
