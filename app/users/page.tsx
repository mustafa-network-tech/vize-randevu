'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import { Users, Crown, UserCog, Eye, Shield, Database, Clock, X, Loader2, Plus } from 'lucide-react'

type Profile = {
  id: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
}

const ROLE_CFG = {
  admin: { label: 'Admin',    icon: Crown,   variant: 'error'   as const, bg: 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'         },
  user:  { label: 'Kullanıcı', icon: Users,  variant: 'default' as const, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' },
}

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email,   setEmail]   = useState('')
  const [role,    setRole]    = useState<'admin' | 'user'>('user')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({ email, password: Math.random().toString(36).slice(2) + 'Aa1!', options: { data: { role } } })
    if (err) { setError(err.message); setLoading(false); return }
    setSuccess(true)
    setTimeout(() => { onInvited(); onClose() }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Kullanıcı Davet Et</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error   && <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">Kullanıcı oluşturuldu.</p>}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">E-posta *</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="kullanici@email.com"
              className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Rol *</label>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="user">Kullanıcı</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Kullanıcıya e-posta ile şifre sıfırlama linki gönderilecek.</p>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" type="button" onClick={onClose}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Oluşturuluyor...</> : 'Kullanıcı Oluştur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showModal,setShowModal]= useState(false)
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  const fetchProfiles = useCallback(async () => {
    const supabase = createClient()
    const [{ data }, { data: { user } }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    setProfiles((data ?? []) as Profile[])
    if (user) {
      const profile = (data ?? []).find((p: Profile) => p.id === user.id)
      setCurrentRole((profile as Profile | undefined)?.role ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfiles() }, [fetchProfiles])

  const updateRole = async (id: string, role: 'admin' | 'user') => {
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
  }

  const counts = {
    total: profiles.length,
    admin: profiles.filter(p => p.role === 'admin').length,
    user:  profiles.filter(p => p.role === 'user').length,
  }

  const isAdmin = currentRole === 'admin'

  if (loading) return <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />

  return (
    <div className="space-y-6">
      {showModal && <InviteModal onClose={() => setShowModal(false)} onInvited={fetchProfiles} />}

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam Kullanıcı', value: counts.total, icon: Users,   color: 'text-blue-600'    },
          { label: 'Admin',             value: counts.admin, icon: Crown,   color: 'text-red-600'     },
          { label: 'Kullanıcı',         value: counts.user,  icon: UserCog, color: 'text-slate-600'   },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
            <item.icon className={cn('w-5 h-5 flex-shrink-0', item.color)} />
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <Shield className="w-4 h-4 flex-shrink-0" />
          Kullanıcı rollerini yönetmek için admin yetkisi gerekir.
        </div>
      )}

      {/* Tablo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Kullanıcılar ({profiles.length})</h3>
          {isAdmin && <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-3 h-3" />Kullanıcı Ekle</Button>}
        </div>

        {profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Henüz kullanıcı profili oluşturulmadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['İsim', 'Şirket', 'Telefon', 'Rol', 'Üyelik Tarihi', isAdmin ? 'Değiştir' : ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {profiles.map(p => {
                  const rc = ROLE_CFG[p.role] ?? ROLE_CFG.user
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(p.full_name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{p.full_name ?? <span className="text-slate-400">—</span>}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{p.company_name ?? '—'}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300">{p.phone ?? '—'}</td>
                      <td className="py-3 px-4"><Badge variant={rc.variant}>{rc.label}</Badge></td>
                      <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        <Clock className="w-3 h-3 inline mr-1" />{new Date(p.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4">
                          <select value={p.role} onChange={e => updateRole(p.id, e.target.value as 'admin' | 'user')}
                            className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="user">Kullanıcı</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
