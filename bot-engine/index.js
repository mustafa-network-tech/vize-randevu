require('dotenv').config()

const { runCycle, getRunningCount } = require('./lib/runner')
const heartbeat                     = require('./lib/heartbeat')

const POLL_INTERVAL_MS = parseInt(process.env.ENGINE_POLL_INTERVAL_MS ?? '5000')

console.log('╔══════════════════════════════════════╗')
console.log('║   Vize Randevu Bot Motoru v1.0       ║')
console.log('╚══════════════════════════════════════╝')
console.log(`Supabase URL : ${process.env.SUPABASE_URL?.slice(0, 30)}...`)
console.log(`Poll aralığı : ${POLL_INTERVAL_MS / 1000}s`)
console.log(`Başlatılıyor...`)
console.log('─'.repeat(45))

let isRunning = false

async function tick() {
  if (isRunning) return
  isRunning = true
  try {
    await runCycle()
  } catch (err) {
    console.error('[engine] Beklenmedik hata:', err.message)
  } finally {
    isRunning = false
  }
}

async function main() {
  // Heartbeat başlat — runner'daki çalışan bot sayısını ilet
  await heartbeat.start(getRunningCount)

  // İlk turu hemen başlat
  tick()

  const timer = setInterval(tick, POLL_INTERVAL_MS)

  async function shutdown(signal) {
    console.log(`\n[engine] ${signal} alındı — kapatılıyor...`)
    clearInterval(timer)
    await heartbeat.stop()
    process.exit(0)
  }

  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch(err => {
  console.error('[engine] Başlatma hatası:', err.message)
  process.exit(1)
})
