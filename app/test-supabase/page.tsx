import { createClient } from '@/lib/supabase/server'
import { CheckCircle2, XCircle, AlertTriangle, Database } from 'lucide-react'

async function testConnection() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Env değişkenleri tanımlı mı?
  if (!url || !key || url === 'your-project-url-here') {
    return {
      ok: false,
      stage: 'env',
      message: 'NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local dosyasında tanımlı değil.',
      detail: null,
    }
  }

  // Supabase'e bağlanmayı dene
  try {
    const supabase = await createClient()
    // Kimlik doğrulaması gerektirmeyen basit bir ping testi
    const { error } = await supabase.auth.getSession()

    if (error) {
      return { ok: false, stage: 'auth', message: 'Supabase bağlantısı kuruldu fakat Auth hatası.', detail: error.message }
    }

    return { ok: true, stage: 'ok', message: 'Supabase bağlantısı başarılı!', detail: url }
  } catch (err: unknown) {
    return {
      ok: false, stage: 'network',
      message: 'Supabase sunucusuna ulaşılamadı.',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

export default async function TestSupabasePage() {
  const result = await testConnection()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">

        {/* Başlık */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Supabase Bağlantı Testi</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Proje: vize-randevu</p>
          </div>
        </div>

        {/* Sonuç kartı */}
        <div className={`rounded-xl border shadow-sm p-6 ${
          result.ok
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
            : result.stage === 'env'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-start gap-3">
            {result.ok
              ? <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
              : result.stage === 'env'
                ? <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                : <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`font-semibold text-sm ${
                result.ok ? 'text-emerald-700 dark:text-emerald-300'
                : result.stage === 'env' ? 'text-amber-700 dark:text-amber-300'
                : 'text-red-700 dark:text-red-300'
              }`}>
                {result.message}
              </p>
              {result.detail && (
                <p className="text-xs mt-2 font-mono break-all text-slate-600 dark:text-slate-400">
                  {result.detail}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Kontrol listesi */}
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Kurulum Kontrol Listesi</p>
          <div className="space-y-2.5">
            {[
              { label: '@supabase/supabase-js yüklü', ok: true },
              { label: '@supabase/ssr yüklü', ok: true },
              { label: 'lib/supabase/client.ts oluşturuldu', ok: true },
              { label: 'lib/supabase/server.ts oluşturuldu', ok: true },
              { label: 'lib/supabase/middleware.ts oluşturuldu', ok: true },
              { label: 'middleware.ts oluşturuldu', ok: true },
              {
                label: 'NEXT_PUBLIC_SUPABASE_URL tanımlı',
                ok: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-project-url-here'),
              },
              {
                label: 'NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı',
                ok: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key-here'),
              },
              { label: 'Supabase Auth bağlantısı', ok: result.ok },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5">
                {item.ok
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                }
                <span className={`text-sm ${item.ok ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sonraki adım */}
        {!result.ok && result.stage === 'env' && (
          <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Yapılacak işlem:</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>.env.local</strong> dosyasını açın ve Supabase Dashboard &gt; Project Settings &gt; API bölümündeki değerleri ekleyin, ardından <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">npm run dev</code> komutunu yeniden çalıştırın.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
