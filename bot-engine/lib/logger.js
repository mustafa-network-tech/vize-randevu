const { getSupabase } = require('./supabase')

const LEVELS = { info: 0, success: 1, warning: 2, error: 3 }
const MIN_LEVEL = LEVELS[process.env.ENGINE_LOG_LEVEL ?? 'info'] ?? 0

function timestamp() {
  return new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

const COLORS = {
  info:    '\x1b[36m',  // cyan
  success: '\x1b[32m',  // green
  warning: '\x1b[33m',  // yellow
  error:   '\x1b[31m',  // red
  reset:   '\x1b[0m',
  dim:     '\x1b[2m',
}

async function log(botId, level, message) {
  if (LEVELS[level] < MIN_LEVEL) return

  const color = COLORS[level] ?? ''
  const prefix = `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${color}[${level.toUpperCase().padEnd(7)}]${COLORS.reset}`
  console.log(`${prefix} ${message}`)

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('bot_logs')
      .insert({ bot_id: botId, level, message })
      .select()

    if (error) {
      console.error(`${COLORS.error}[LOGGER] ❌ Supabase insert hatası:${COLORS.reset}`, error.message, '| Kod:', error.code)
    } else {
      console.log(`${COLORS.dim}[LOGGER] ✓ DB insert OK — id: ${data?.[0]?.id ?? '?'}${COLORS.reset}`)
    }
  } catch (err) {
    console.error(`${COLORS.error}[LOGGER] ❌ Beklenmedik DB hatası:${COLORS.reset}`, err.message)
  }
}

const createLogger = (botId, botName = '') => {
  const prefix = botName ? `[${botName}] ` : ''
  return {
    info:    (msg) => log(botId, 'info',    prefix + msg),
    success: (msg) => log(botId, 'success', prefix + msg),
    warning: (msg) => log(botId, 'warning', prefix + msg),
    error:   (msg) => log(botId, 'error',   prefix + msg),
  }
}

module.exports = { createLogger, log }
