require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const updates = [
    sb.from('bots').update({ check_interval: 360, next_retry_at: null, last_run: null }).eq('name', 'spain'),
    sb.from('bots').update({ next_retry_at: null, last_run: null }).eq('name', 'italy'),
    sb.from('bots').update({ next_retry_at: null, last_run: null }).eq('name', 'holanda'),
  ]
  const results = await Promise.all(updates)
  results.forEach((r, i) => {
    const names = ['spain', 'italy', 'holanda']
    if (r.error) console.error(`${names[i]} HATA: ${r.error.message}`)
    else console.log(`${names[i]}: sifirlandı`)
  })
}
main().then(() => setTimeout(() => process.exit(0), 200)).catch(e => { console.error(e.message); process.exit(1) })
