const { getSupabase } = require('./supabase')
const os = require('os')

const ENGINE_ID             = 'bot-engine'
const VERSION               = '1.0'
const HEARTBEAT_INTERVAL_MS = 30_000  // 30 saniye

const C = {
  green: '\x1b[32m',
  dim:   '\x1b[2m',
  red:   '\x1b[31m',
  reset: '\x1b[0m',
}

let _timer        = null
let _getWorkerCount = () => 0   // runner.js tarafından set edilir

function ts() {
  return new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' })
}

async function upsertStatus(fields) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('engine_status')
      .upsert({ id: ENGINE_ID, ...fields }, { onConflict: 'id' })
    if (error) {
      console.error(`${C.red}[heartbeat] Supabase hata:${C.reset}`, error.message)
    }
  } catch (err) {
    console.error(`${C.red}[heartbeat] DB bağlantı hatası:${C.reset}`, err.message)
  }
}

async function beat() {
  const now         = new Date().toISOString()
  const workerCount = _getWorkerCount()
  console.log(`${C.green}[${ts()}] ✓ Bot engine alive — workers: ${workerCount}${C.reset}`)
  await upsertStatus({
    status:         'online',
    last_heartbeat: now,
    worker_count:   workerCount,
  })
}

/**
 * Heartbeat'i başlatır.
 * @param {() => number} getWorkerCount - Şu an çalışan worker sayısını dönen fonksiyon
 */
async function start(getWorkerCount = () => 0) {
  _getWorkerCount = getWorkerCount
  console.log(`${C.dim}[heartbeat] Başlatılıyor — ${HEARTBEAT_INTERVAL_MS / 1000}s aralıkla heartbeat${C.reset}`)
  await upsertStatus({
    status:         'online',
    started_at:     new Date().toISOString(),
    last_heartbeat: new Date().toISOString(),
    version:        VERSION,
    host:           os.hostname(),
    worker_count:   0,
  })
  await beat()
  _timer = setInterval(beat, HEARTBEAT_INTERVAL_MS)
}

async function stop() {
  if (_timer) clearInterval(_timer)
  _timer = null
  console.log(`${C.dim}[heartbeat] Duruluyor — engine_status → offline${C.reset}`)
  await upsertStatus({
    status:         'offline',
    last_heartbeat: new Date().toISOString(),
    worker_count:   0,
  })
}

module.exports = { start, stop }
