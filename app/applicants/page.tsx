'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Plus, X, Loader2, User, Phone, Star, Trash2, Edit, Database } from 'lucide-react'

type Applicant = {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  nationality: string | null
  passport_number: string | null
  passport_expiry: string | null
  email: string | null
  phone: string | null
  priority: number
  is_active: boolean
  created_at: string
}

function Modal({ initial, onClose, onSaved }: { initial?: Applicant | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    full_name: initial?.full_name ?? '',
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    date_of_birth: initial?.date_of_birth ?? '',
    nationality: initial?.nationality ?? 'TR',
    passport_number: initial?.passport_number ?? '',
    passport_expiry: initial?.passport_expiry ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    priority: String(initial?.priority ?? 1),
    is_active: initial?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const F = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı.'); setLoading(false); return }

    const payload = { ...form, priority: parseInt(form.priority), user_id: user.id }

    const { error: err } = initial
      ? await supabase.from('applicants').update(payload).eq('id', initial.id)
      : await supabase.from('applicants').insert(payload)

    if (err) { setError(err.message); setLoading(false); return }
    onSaved(); onClose()
  }

  const inputCls = 'w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelCls = 'text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl my-4">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {initial ? 'Başvuranı Düzenle' : 'Yeni Başvuran Ekle'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}

          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
            Bu bilgiler bot otomatik rezervasyon yaparken VFS formuna doldurulacak.
          </div>

          <div>
            <label className={labelCls}>Ad Soyad *</label>
            <input required type="text" value={form.full_name} onChange={F('full_name')} placeholder="Ahmet Yılmaz" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ad</label>
              <input type="text" value={form.first_name} onChange={F('first_name')} placeholder="Ahmet" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Soyad</label>
              <input type="text" value={form.last_name} onChange={F('last_name')} placeholder="Yılmaz" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Doğum Tarihi</label>
              <input type="date" value={form.date_of_birth} onChange={F('date_of_birth')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Uyruk</label>
              <input type="text" value={form.nationality} onChange={F('nationality')} placeholder="TR" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Pasaport No</label>
              <input type="text" value={form.passport_number} onChange={F('passport_number')} placeholder="A12345678" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Pasaport Geçerlilik</label>
              <input type="date" value={form.passport_expiry} onChange={F('passport_expiry')} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>E-posta</label>
              <input type="email" value={form.email} onChange={F('email')} placeholder="ahmet@email.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Telefon</label>
              <input type="tel" value={form.phone} onChange={F('phone')} placeholder="+90 555 000 0000" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className={labelCls}>Öncelik <span className="text-slate-400">(1 = en yüksek)</span></label>
              <input type="number" min="1" max="99" value={form.priority} onChange={F('priority')} className={inputCls} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer pb-2">
              <input type="checkbox" checked={form.is_active} onChange={F('is_active')} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Otomatik rezervasyona dahil et</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Kaydediliyor...</> : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState<{ open: boolean; item: Applicant | null }>({ open: false, item: null })

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('applicants').select('*').order('priority', { ascending: true })
    setApplicants((data ?? []) as Applicant[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (id: string) => {
    if (!confirm('Bu başvuranı silmek istiyor musunuz?')) return
    const supabase = createClient()
    await supabase.from('applicants').delete().eq('id', id)
    setApplicants(prev => prev.filter(a => a.id !== id))
  }

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('applicants').update({ is_active: !current }).eq('id', id)
    setApplicants(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a))
  }

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {modal.open && <Modal initial={modal.item} onClose={() => setModal({ open: false, item: null })} onSaved={fetchData} />}

      {/* Bilgi banner */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-4 flex items-start gap-3">
        <Star className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Otomatik Rezervasyon</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
            Bot bir randevu bulduğunda ve <b>Otomatik Rezervasyon</b> açıksa, bu listedeki en yüksek öncelikli aktif başvuranın bilgileriyle
            VFS formunu doldurup randevuyu alır. Pasaport bilgilerini eksiksiz doldurun.
          </p>
        </div>
      </div>

      {/* Başvuranlar listesi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Başvuranlar ({applicants.length})</h3>
          <Button size="sm" onClick={() => setModal({ open: true, item: null })}><Plus className="w-3 h-3" />Başvuran Ekle</Button>
        </div>

        {applicants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Henüz başvuran eklenmedi</p>
              <p className="text-xs text-slate-400 mt-1">Otomatik rezervasyon için en az bir başvuran ekleyin.</p>
            </div>
            <Button onClick={() => setModal({ open: true, item: null })}><Plus className="w-3 h-3" />Başvuran Ekle</Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {applicants.map(a => (
              <div key={a.id} className={cn('px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors', !a.is_active && 'opacity-50')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {a.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{a.full_name}</p>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-semibold">Öncelik {a.priority}</span>
                    <Badge variant={a.is_active ? 'success' : 'default'} dot>{a.is_active ? 'Aktif' : 'Pasif'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {a.passport_number && <span>🪪 {a.passport_number}</span>}
                    {a.date_of_birth   && <span>🎂 {new Date(a.date_of_birth).toLocaleDateString('tr-TR')}</span>}
                    {a.passport_expiry && <span>📅 Bitiş: {new Date(a.passport_expiry).toLocaleDateString('tr-TR')}</span>}
                    {a.phone           && <span>📞 {a.phone}</span>}
                    {a.email           && <span>✉️ {a.email}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(a.id, a.is_active)}
                    className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors',
                      a.is_active
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : 'border-slate-200 text-slate-500 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    )}>
                    {a.is_active ? 'Devre Dışı' : 'Etkinleştir'}
                  </button>
                  <button onClick={() => setModal({ open: true, item: a })}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(a.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
