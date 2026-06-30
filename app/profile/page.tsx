'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { User, Mail, Phone, Building2, Shield, Save, Loader2, CheckCircle2, Key, Eye, EyeOff } from 'lucide-react'

type Profile = {
  id: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

function AvatarCircle({ name, role, size = 'lg' }: { name: string; role: string; size?: 'sm' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const s = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm'
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0',
      role === 'admin' ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700',
      s
    )}>
      {initials || '?'}
    </div>
  )
}

export default function ProfilePage() {
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [email,    setEmail]    = useState('')
  const [form,     setForm]     = useState({ full_name: '', company_name: '', phone: '' })
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [loading,  setLoading]  = useState(true)

  // Şifre değiştirme
  const [pwForm,   setPwForm]   = useState({ current: '', newPw: '', confirm: '' })
  const [showPw,   setShowPw]   = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg,    setPwMsg]    = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data as Profile)
        setForm({ full_name: data.full_name ?? '', company_name: data.company_name ?? '', phone: data.phone ?? '' })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: form.full_name, company_name: form.company_name, phone: form.phone }).eq('id', user.id)
    setProfile(prev => prev ? { ...prev, ...form } : prev)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' }); return }
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'error', text: 'Şifre en az 6 karakter olmalı.' }); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    if (error) { setPwMsg({ type: 'error', text: error.message }) }
    else { setPwMsg({ type: 'success', text: 'Şifre başarıyla güncellendi.' }); setPwForm({ current: '', newPw: '', confirm: '' }) }
    setPwSaving(false)
  }

  const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400'
  const labelCls = 'text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5'
  const F = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }))
  const FP = (k: keyof typeof pwForm) => (e: React.ChangeEvent<HTMLInputElement>) => setPwForm(p => ({ ...p, [k]: e.target.value }))

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  const displayName = form.full_name || email.split('@')[0] || 'Kullanıcı'

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Profil özeti kartı */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center gap-5">
        <AvatarCircle name={displayName} role={profile?.role ?? 'user'} size="lg" />
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{displayName}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              'text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5',
              profile?.role === 'admin'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
            )}>
              <Shield className="w-3 h-3" />
              {profile?.role === 'admin' ? 'Admin' : 'Kullanıcı'}
            </span>
            {profile?.created_at && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Üyelik: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profil bilgileri düzenle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />Profil Bilgileri
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Ad, şirket ve iletişim bilgilerinizi güncelleyin.</p>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Ad Soyad</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={form.full_name} onChange={F('full_name')} placeholder="Adınız Soyadınız" className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div>
            <label className={labelCls}>E-posta</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" value={email} disabled className={cn(inputCls, 'pl-9 opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50')} />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">E-posta adresi değiştirilemez.</p>
          </div>
          <div>
            <label className={labelCls}>Şirket / Ofis Adı</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={form.company_name} onChange={F('company_name')} placeholder="Şirket veya ofis adı" className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Telefon</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="tel" value={form.phone} onChange={F('phone')} placeholder="+90 555 000 0000" className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            {saved ? (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />Kaydedildi!
              </span>
            ) : <span />}
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="w-3 h-3 animate-spin" />Kaydediliyor...</> : <><Save className="w-3 h-3" />Kaydet</>}
            </Button>
          </div>
        </form>
      </div>

      {/* Şifre değiştir */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />Şifre Değiştir
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Güvenliğiniz için şifrenizi düzenli olarak güncelleyin.</p>
        </div>
        <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
          {pwMsg && (
            <div className={cn(
              'text-sm rounded-xl px-4 py-3 border font-medium',
              pwMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            )}>
              {pwMsg.text}
            </div>
          )}
          <div>
            <label className={labelCls}>Yeni Şifre</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPw ? 'text' : 'password'} value={pwForm.newPw} onChange={FP('newPw')} placeholder="En az 6 karakter" className={cn(inputCls, 'pl-9 pr-10')} />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={labelCls}>Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={FP('confirm')} placeholder="Şifreyi tekrar girin" className={cn(inputCls, 'pl-9')} />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="submit" variant="secondary" disabled={pwSaving || !pwForm.newPw || !pwForm.confirm}>
              {pwSaving ? <><Loader2 className="w-3 h-3 animate-spin" />Güncelleniyor...</> : <><Key className="w-3 h-3" />Şifreyi Güncelle</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
