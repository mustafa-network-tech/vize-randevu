'use client'

import { useState } from 'react'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Shield,
  UserCog, Eye, Activity, X, Clock, CheckCircle2,
} from 'lucide-react'

type UserRole    = 'admin' | 'manager' | 'operator' | 'viewer'
type UserStatus  = 'active' | 'inactive' | 'suspended'

interface StaffUser {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  createdAt: string
  permissions: string[]
  avatar: string
}

const MOCK_USERS: StaffUser[] = [
  { id: 1, name: 'Mehmet Yılmaz',  email: 'mehmet@vizerandevu.com',  role: 'admin',    status: 'active',    lastLogin: '2 dk önce',   createdAt: '01 Oca 2026', permissions: ['all'],                                     avatar: 'MY' },
  { id: 2, name: 'Ayşe Kaya',      email: 'ayse@vizerandevu.com',    role: 'manager',  status: 'active',    lastLogin: '15 dk önce',  createdAt: '15 Oca 2026', permissions: ['bots', 'accounts', 'reports'],             avatar: 'AK' },
  { id: 3, name: 'Can Demir',      email: 'can@vizerandevu.com',     role: 'operator', status: 'active',    lastLogin: '1 sa önce',   createdAt: '01 Şub 2026', permissions: ['bots', 'logs'],                             avatar: 'CD' },
  { id: 4, name: 'Zeynep Arslan',  email: 'zeynep@vizerandevu.com',  role: 'operator', status: 'active',    lastLogin: '3 sa önce',   createdAt: '10 Şub 2026', permissions: ['bots', 'accounts'],                         avatar: 'ZA' },
  { id: 5, name: 'Ali Şahin',      email: 'ali@vizerandevu.com',     role: 'viewer',   status: 'inactive',  lastLogin: '2 gün önce',  createdAt: '20 Şub 2026', permissions: ['view_only'],                               avatar: 'AŞ' },
  { id: 6, name: 'Fatma Çelik',    email: 'fatma@vizerandevu.com',   role: 'manager',  status: 'active',    lastLogin: '5 sa önce',   createdAt: '01 Mar 2026', permissions: ['accounts', 'reports', 'notifications'],   avatar: 'FÇ' },
  { id: 7, name: 'Hasan Öztürk',   email: 'hasan@vizerandevu.com',   role: 'viewer',   status: 'suspended', lastLogin: '1 hafta önce',createdAt: '15 Mar 2026', permissions: ['view_only'],                               avatar: 'HÖ' },
]

const roleCfg: Record<UserRole, { label: string; variant: BadgeVariant; icon: typeof Shield; color: string }> = {
  admin:    { label: 'Admin',    variant: 'error',   icon: Shield,   color: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'         },
  manager:  { label: 'Manager',  variant: 'info',    icon: UserCog,  color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'     },
  operator: { label: 'Operator', variant: 'warning', icon: Activity, color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400' },
  viewer:   { label: 'Viewer',   variant: 'default', icon: Eye,      color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
}

const statusCfg: Record<UserStatus, { label: string; variant: BadgeVariant }> = {
  active:    { label: 'Aktif',      variant: 'success' },
  inactive:  { label: 'Pasif',      variant: 'default' },
  suspended: { label: 'Askıya Alındı', variant: 'error' },
}

const PERMISSIONS_MAP: Record<string, string> = {
  all: 'Tam Yetki', bots: 'Botlar', accounts: 'Hesaplar',
  reports: 'Raporlar', logs: 'Loglar', notifications: 'Bildirimler', view_only: 'Sadece Görüntüle',
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Yeni Kullanıcı Ekle</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sisteme yeni personel ekle</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Ad *</label>
              <input type="text" placeholder="Ad" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Soyad *</label>
              <input type="text" placeholder="Soyad" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">E-posta *</label>
            <input type="email" placeholder="ornek@vizerandevu.com" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Rol *</label>
            <select className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="viewer">Viewer — Sadece görüntüle</option>
              <option value="operator">Operator — Bot ve log yönetimi</option>
              <option value="manager">Manager — Hesap ve rapor yönetimi</option>
              <option value="admin">Admin — Tam yetki</option>
            </select>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Kullanıcıya giriş bilgileri e-posta ile gönderilecektir. İlk girişte şifre değiştirmesi zorunludur.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={onClose}>Kullanıcı Oluştur</Button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [showModal, setShowModal]   = useState(false)
  const [search, setSearch]         = useState('')
  const [openMenu, setOpenMenu]     = useState<number | null>(null)

  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const roleCounts = {
    admin:    MOCK_USERS.filter(u => u.role === 'admin').length,
    manager:  MOCK_USERS.filter(u => u.role === 'manager').length,
    operator: MOCK_USERS.filter(u => u.role === 'operator').length,
    viewer:   MOCK_USERS.filter(u => u.role === 'viewer').length,
  }

  return (
    <div className="space-y-6">
      {showModal && <AddUserModal onClose={() => setShowModal(false)} />}

      {/* Rol özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(Object.entries(roleCounts) as [UserRole, number][]).map(([role, count]) => {
          const rc = roleCfg[role]
          return (
            <div key={role} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', rc.color)}>
                <rc.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{rc.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Yetki matrisi */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">Rol Yetki Matrisi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left font-semibold text-slate-500 dark:text-slate-400 py-2 px-3 min-w-[130px]">Özellik</th>
                {(['admin', 'manager', 'operator', 'viewer'] as UserRole[]).map(r => (
                  <th key={r} className="text-center font-semibold text-slate-500 dark:text-slate-400 py-2 px-3">{roleCfg[r].label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {[
                ['Dashboard', true, true, true, true],
                ['Bot Yönetimi', true, true, true, false],
                ['Hesap Yönetimi', true, true, false, false],
                ['Proxy Yönetimi', true, true, false, false],
                ['Analitik', true, true, true, true],
                ['Kullanıcı Yönetimi', true, false, false, false],
                ['Sistem Ayarları', true, false, false, false],
              ].map(([feature, ...perms]) => (
                <tr key={feature as string} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{feature as string}</td>
                  {(perms as boolean[]).map((p, i) => (
                    <td key={i} className="py-2.5 px-3 text-center">
                      {p
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <span className="text-slate-200 dark:text-slate-700 text-base">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Personel tablosu */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tüm Personel ({filtered.length})</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ad veya e-posta ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
            </div>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-3 h-3" />Kullanıcı Ekle
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Kullanıcı', 'Rol', 'Durum', 'Son Giriş', 'Yetkiler', 'Oluşturuldu', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(user => {
                const rc = roleCfg[user.role]
                const sc = statusCfg[user.status]
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', rc.color)}>
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={rc.variant}>{rc.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={sc.variant} dot>{sc.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />{user.lastLogin}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
                        {user.permissions.map(p => (
                          <span key={p} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                            {PERMISSIONS_MAP[p] ?? p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {user.createdAt}
                    </td>
                    <td className="py-3.5 px-4 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === user.id && (
                        <div className="absolute right-4 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
                          <button onClick={() => setOpenMenu(null)} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <Edit className="w-3.5 h-3.5" />Düzenle
                          </button>
                          <button onClick={() => setOpenMenu(null)} className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />Sil
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
