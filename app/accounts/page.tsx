'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Plus, Search, MoreHorizontal, Edit, Trash2, Globe, Clock, X, Loader2, Database } from 'lucide-react'

type VisaAccount = {
  id: string
  user_id: string
  provider: string
  email: string
  country: string
  city: string | null
  visa_center: string | null
  visa_type: string | null
  status: string
  created_at: string
}

const COUNTRY_EMOJI: Record<string, string> = {
  'italya': '🇮🇹', 'italy': '🇮🇹',
  'hollanda': '🇳🇱', 'netherlands': '🇳🇱',
  'almanya': '🇩🇪', 'germany': '🇩🇪',
  'fransa': '🇫🇷', 'france': '🇫🇷',
  'ispanya': '🇪🇸', 'spain': '🇪🇸',
  'polonya': '🇵🇱', 'poland': '🇵🇱',
  'yunanistan': '🇬🇷', 'greece': '🇬🇷',
}
const getEmoji = (c: string) => COUNTRY_EMOJI[c.toLowerCase()] ?? '🌍'

function AddModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ provider: 'vfs', email: '', password: '', country: '', city: '', visa_center: '', visa_type: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı.'); setLoading(false); return }
    const { error: err } = await supabase.from('visa_accounts').insert({
      user_id: user.id,
      provider: form.provider,
      email: form.email,
      encrypted_password: form.password,
      country: form.country,
      city: form.city || null,
      visa_center: form.visa_center || null,
      visa_type: form.visa_type || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onAdded()
    onClose()
  }

  const F = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Yeni VFS Hesabı</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Sağlayıcı *</label>
              <select value={form.provider} onChange={F('provider')} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="vfs">VFS Global</option>
                <option value="bls">BLS International</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Ülke *</label>
              <input required type="text" value={form.country} onChange={F('country')} placeholder="İtalya" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">E-posta *</label>
            <input required type="email" value={form.email} onChange={F('email')} placeholder="ornek@email.com" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Şifre *</label>
            <input required type="password" value={form.password} onChange={F('password')} placeholder="VFS portal şifresi" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Şehir</label>
              <input type="text" value={form.city} onChange={F('city')} placeholder="Roma" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Vize Tipi</label>
              <input type="text" value={form.visa_type} onChange={F('visa_type')} placeholder="Schengen" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Vize Merkezi</label>
            <input type="text" value={form.visa_center} onChange={F('visa_center')} placeholder="İstanbul VFS" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Kaydediliyor...</> : 'Hesap Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<VisaAccount[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [showModal,setShowModal]= useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('visa_accounts').select('*').order('created_at', { ascending: false })
    setAccounts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return
    const supabase = createClient()
    await supabase.from('visa_accounts').delete().eq('id', id)
    setAccounts(prev => prev.filter(a => a.id !== id))
    setOpenMenu(null)
  }

  const filtered = accounts.filter(a =>
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  )

  const counts = { active: accounts.filter(a => a.status === 'active').length, inactive: accounts.filter(a => a.status === 'inactive').length }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" />
      <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" />
    </div>
  )

  return (
    <div className="space-y-6">
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdded={fetchAccounts} />}

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Toplam Hesap', value: accounts.length, color: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'     },
          { label: 'Aktif',        value: counts.active,   color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' },
          { label: 'Pasif',        value: counts.inactive, color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'   },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
            <p className={cn('text-2xl font-bold', item.color.split(' ')[0])}>{item.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">VFS Hesapları ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="E-posta veya ülke..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
            </div>
            <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-3 h-3" />Yeni Hesap</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {accounts.length === 0 ? 'Henüz VFS hesabı eklenmedi.' : 'Arama sonucu bulunamadı.'}
            </p>
            {accounts.length === 0 && <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-3 h-3" />İlk Hesabı Ekle</Button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['E-posta', 'Sağlayıcı', 'Ülke / Şehir', 'Vize Tipi', 'Durum', 'Oluşturuldu', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 text-sm">{acc.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-semibold uppercase">{acc.provider}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-400" />{getEmoji(acc.country)} {acc.country}</div>
                      {acc.city && <p className="text-slate-400 mt-0.5">{acc.city}</p>}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{acc.visa_type ?? '—'}</td>
                    <td className="py-3 px-4"><Badge variant={acc.status === 'active' ? 'success' : 'default'} dot>{acc.status === 'active' ? 'Aktif' : 'Pasif'}</Badge></td>
                    <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      <Clock className="w-3 h-3 inline mr-1" />{new Date(acc.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-4 relative">
                      <button onClick={() => setOpenMenu(openMenu === acc.id ? null : acc.id)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === acc.id && (
                        <div className="absolute right-4 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 py-1 min-w-[130px]">
                          <button onClick={() => setOpenMenu(null)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Edit className="w-3.5 h-3.5" />Düzenle
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                            <Trash2 className="w-3.5 h-3.5" />Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
