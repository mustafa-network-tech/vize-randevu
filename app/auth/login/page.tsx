'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'E-posta veya şifre hatalı.'
            : authError.message
        )
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Sol panel — marka */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] bg-[#0B1426] p-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Vize Randevu</p>
            <p className="text-slate-500 text-xs">Otomasyon Paneli</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white leading-snug mb-3">
            VFS randevu sürecinizi<br />otomatikleştirin.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Botlarınızı yönetin, randevuları takip edin ve müşterilerinizi zamanında bilgilendirin.
          </p>

          <div className="mt-8 space-y-3">
            {[
              '🇮🇹  İtalya — 47 randevu bulundu',
              '🇳🇱  Hollanda — 18 randevu bulundu',
              '🇩🇪  Almanya — 4 randevu bulundu',
            ].map(item => (
              <div key={item} className="bg-white/5 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2026 Vize Randevu. Tüm hakları saklıdır.</p>
      </div>

      {/* Sağ panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobil logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Vize Randevu</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Giriş Yap</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Hesabınız yok mu?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline font-medium">
              Kayıt Ol
            </Link>
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Şifre
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                  Şifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Giriş yapılıyor...</>
                : 'Giriş Yap'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
