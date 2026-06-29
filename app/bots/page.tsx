'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Plus, Play, Square, RefreshCw, Database, Clock, X, Loader2, Zap } from 'lucide-react'

type Bot = {
  id: string
  user_id: string
  visa_account_id: string
  name: string
  provider: string
  status: 'idle' | 'running' | 'paused' | 'error'
  check_interval: number
  auto_book: boolean
  last_run: string | null
  created_at: string
  visa_accounts?: { email: string; country: string } | null
}

type VisaAccount = { id: string; email: string; country: string }

const STATUS_CFG = {
  idle:    { label: 'Bekliyor',   variant: 'default'  as const, dot: 'bg-slate-400'  },
  running: { label: 'Çalışıyor', variant: 'success'  as const, dot: 'bg-emerald-400 animate-pulse' },
  paused:  { label: 'Duraklatıldı', variant: 'warning' as const, dot: 'bg-amber-400' },
  error:   { label: 'Hata',      variant: 'error'    as const, dot: 'bg-red-500'     },
}

function AddBotModal({ accounts, onClose, onAdded }: { accounts: VisaAccount[]; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name: '', visa_account_id: accounts[0]?.id ?? '', check_interval: '60', auto_book: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı.'); setLoading(false); return }
    const acc = accounts.find(a => a.id === form.visa_account_id)
    const { error: err } = await supabase.from('bots').insert({
      user_id: user.id,
      visa_account_id: form.visa_account_id,
      name: form.name,
      provider: acc ? 'vfs' : 'vfs',
      check_interval: parseInt(form.check_interval),
      auto_book: form.auto_book,
    })
    if (err) { setError(err.message); setLoading(false); return }
    onAdded(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Yeni Bot Oluştur</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
          {accounts.length === 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Bot oluşturmak için önce bir VFS hesabı ekleyin.
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Bot Adı *</label>
            <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="İtalya Bot #1"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">VFS Hesabı *</label>
            <select required value={form.visa_account_id} onChange={e => setForm(p => ({ ...p, visa_account_id: e.target.value }))}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {accounts.map(a => <option key={a.id} value={a.id}>{a.email} — {a.country}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Tarama Aralığı (sn) *</label>
            <input type="number" min="10" max="3600" value={form.check_interval} onChange={e => setForm(p => ({ ...p, check_interval: e.target.value }))}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.auto_book} onChange={e => setForm(p => ({ ...p, auto_book: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-blue-600" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Otomatik rezervasyon yap</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading || accounts.length === 0}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Oluşturuluyor...</> : 'Bot Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BotsPage() {
  const [bots,     setBots]     = useState<Bot[]>([])
  const [accounts, setAccounts] = useState<VisaAccount[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showModal,setShowModal]= useState(false)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: botsData }, { data: accData }] = await Promise.all([
      supabase.from('bots').select('*, visa_accounts(email, country)').order('created_at', { ascending: false }),
      supabase.from('visa_accounts').select('id, email, country').eq('status', 'active'),
    ])
    setBots((botsData ?? []) as Bot[])
    setAccounts(accData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const setStatus = async (id: string, status: Bot['status']) => {
    const supabase = createClient()
    await supabase.from('bots').update({ status }).eq('id', id)
    setBots(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu botu silmek istiyor musunuz? Tüm loglar da silinecek.')) return
    const supabase = createClient()
    await supabase.from('bots').delete().eq('id', id)
    setBots(prev => prev.filter(b => b.id !== id))
  }

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {showModal && <AddBotModal accounts={accounts} onClose={() => setShowModal(false)} onAdded={fetchData} />}

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['running', 'idle', 'paused', 'error'] as Bot['status'][]).map(s => {
          const count = bots.filter(b => b.status === s).length
          const sc = STATUS_CFG[s]
          return (
            <div key={s} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
              <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', sc.dot)} />
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sc.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Başlık + ekle butonu */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bot Listesi ({bots.length})</h2>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-3 h-3" />Bot Oluştur</Button>
      </div>

      {/* Empty state */}
      {bots.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
            <Database className="w-7 h-7 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Henüz bot oluşturulmadı</p>
            <p className="text-xs text-slate-400 mt-1">VFS hesabı ekleyip bot oluşturarak taramaya başlayın.</p>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus className="w-3 h-3" />İlk Botu Oluştur</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map(bot => {
            const sc = STATUS_CFG[bot.status]
            return (
              <div key={bot.id} className={cn(
                'bg-white dark:bg-slate-900 rounded-xl border shadow-sm p-5',
                bot.status === 'error' ? 'border-red-200 dark:border-red-900' :
                bot.status === 'running' ? 'border-emerald-200 dark:border-emerald-900' :
                'border-slate-200 dark:border-slate-800'
              )}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{bot.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{bot.visa_accounts?.email ?? '—'}</p>
                    </div>
                  </div>
                  <Badge variant={sc.variant} dot>{sc.label}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{bot.check_interval}s</p>
                    <p className="text-xs text-slate-400 mt-0.5">Aralık</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{bot.visa_accounts?.country ?? '—'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ülke</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{bot.auto_book ? 'Evet' : 'Hayır'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Oto-Rezerv</p>
                  </div>
                </div>

                {bot.last_run && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" />Son: {new Date(bot.last_run).toLocaleString('tr-TR')}
                  </p>
                )}

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {bot.status !== 'running' ? (
                    <Button size="sm" onClick={() => setStatus(bot.id, 'running')} className="flex-1">
                      <Play className="w-3 h-3" />Başlat
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setStatus(bot.id, 'idle')} className="flex-1">
                      <Square className="w-3 h-3" />Durdur
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setStatus(bot.id, 'idle')}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(bot.id)}>Sil</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
