'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (authError) {
        setError(
          authError.message === 'User already registered'
            ? 'Bu e-posta adresi zaten kayıtlı.'
            : authError.message
        )
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* Sol panel */}
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
            Hemen başlayın,<br />randevuları bize bırakın.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hesabınızı oluşturun ve VFS randevu otomasyonunu dakikalar içinde kullanmaya başlayın.
          </p>

          <div className="mt-8 space-y-4">
            {[
              { icon: '⚡', title: 'Hızlı Kurulum',    desc: '5 dakikada botunuzu kurun'        },
              { icon: '🔔', title: 'Anlık Bildirim',   desc: 'Telegram, WhatsApp, E-posta'      },
              { icon: '🛡️', title: 'Güvenli Altyapı',  desc: 'SSL şifreli, GDPR uyumlu'        },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
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

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Kayıt Ol</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Zaten hesabınız var mı?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
              Giriş Yap
            </Link>
          </p>

          {/* Başarı mesajı */}
          {success && (
            <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Hesabınız oluşturuldu! E-postanızı onaylayın. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          )}

          {/* Hata mesajı */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
                />
              </div>
            </div>

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
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Şifre <span className="text-slate-400 font-normal">(en az 8 karakter)</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
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

              {/* Şifre gücü göstergesi */}
              {password.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                      password.length >= i * 3
                        ? password.length < 6  ? 'bg-red-400'
                        : password.length < 10 ? 'bg-amber-400'
                        : 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Hesap oluşturuluyor...</>
                : 'Hesap Oluştur'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
