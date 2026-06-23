'use client'

import { useState } from 'react'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/helpers/cn'
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Mail,
  Phone, Globe, Clock, ShieldCheck, Lock, AlertTriangle, X, User,
} from 'lucide-react'

type AccountStatus = 'active' | 'waiting' | 'locked' | 'captcha'

interface Account {
  id: number
  owner: string
  email: string
  phone: string
  country: string
  countryEmoji: string
  visaType: string
  lastLogin: string
  status: AccountStatus
  createdAt: string
}

const MOCK_ACCOUNTS: Account[] = [
  { id: 1, owner: 'Seda Özer',      email: 'seda.ozer@email.com',    phone: '+90 532 111 2233', country: 'İtalya',   countryEmoji: '🇮🇹', visaType: 'Schengen',   lastLogin: '2 dk önce',  status: 'active',  createdAt: '10 Haz 2026' },
  { id: 2, owner: 'Akif Can',       email: 'akif.can@email.com',     phone: '+90 541 222 3344', country: 'İtalya',   countryEmoji: '🇮🇹', visaType: 'Schengen',   lastLogin: '15 dk önce', status: 'active',  createdAt: '12 Haz 2026' },
  { id: 3, owner: 'Selma İdiz',     email: 'selma.idiz@email.com',   phone: '+90 505 333 4455', country: 'Hollanda', countryEmoji: '🇳🇱', visaType: 'Schengen',   lastLogin: '1 sa önce',  status: 'captcha', createdAt: '14 Haz 2026' },
  { id: 4, owner: 'Yeliz Özsoy',    email: 'yeliz.ozsoy@email.com',  phone: '+90 553 444 5566', country: 'İtalya',   countryEmoji: '🇮🇹', visaType: 'Öğrenci',    lastLogin: '3 sa önce',  status: 'active',  createdAt: '15 Haz 2026' },
  { id: 5, owner: 'Mehmet İnce',    email: 'mehmet.ince@email.com',  phone: '+90 542 555 6677', country: 'Almanya',  countryEmoji: '🇩🇪', visaType: 'Schengen',   lastLogin: '1 gün önce', status: 'waiting', createdAt: '16 Haz 2026' },
  { id: 6, owner: 'Pelin Köşker',   email: 'pelin.kosker@email.com', phone: '+90 536 666 7788', country: 'İtalya',   countryEmoji: '🇮🇹', visaType: 'Schengen',   lastLogin: '2 gün önce', status: 'locked',  createdAt: '17 Haz 2026' },
  { id: 7, owner: 'Yılmaz Er',      email: 'yilmaz.er@email.com',    phone: '+90 544 777 8899', country: 'Fransa',   countryEmoji: '🇫🇷', visaType: 'Schengen',   lastLogin: '3 gün önce', status: 'waiting', createdAt: '18 Haz 2026' },
  { id: 8, owner: 'Hüseyin Demir',  email: 'huseyind@email.com',     phone: '+90 531 888 9900', country: 'İtalya',   countryEmoji: '🇮🇹', visaType: 'İş',         lastLogin: '22:35',      status: 'active',  createdAt: '19 Haz 2026' },
  { id: 9, owner: 'Filiz Yiğit',    email: 'filiz.yigit@email.com',  phone: '+90 551 999 0011', country: 'Hollanda', countryEmoji: '🇳🇱', visaType: 'Schengen',   lastLogin: '22:40',      status: 'active',  createdAt: '20 Haz 2026' },
]

const statusConfig: Record<AccountStatus, { label: string; variant: BadgeVariant; icon: typeof ShieldCheck }> = {
  active:  { label: 'Aktif',             variant: 'success', icon: ShieldCheck   },
  waiting: { label: 'Bekliyor',          variant: 'warning', icon: Clock         },
  locked:  { label: 'Kilitlendi',        variant: 'error',   icon: Lock          },
  captcha: { label: 'CAPTCHA Bekliyor',  variant: 'warning', icon: AlertTriangle },
}

function AddAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Yeni Hesap Ekle</h2>
            <p className="text-xs text-slate-400 mt-0.5">VFS sistemi için yeni müşteri hesabı oluştur</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Hesap Sahibi *</label>
              <input type="text" placeholder="Ad Soyad" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Telefon *</label>
              <input type="tel" placeholder="+90 5xx xxx xxxx" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">E-posta *</label>
            <input type="email" placeholder="ornek@email.com" className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Ülke *</label>
              <select className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>İtalya</option>
                <option>Hollanda</option>
                <option>Almanya</option>
                <option>Fransa</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Vize Tipi *</label>
              <select className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Schengen</option>
                <option>Öğrenci</option>
                <option>İş</option>
                <option>Aile</option>
              </select>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hesap oluşturulduktan sonra ilgili bot otomatik olarak atanacak ve randevu arayışı başlatılacaktır.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={onClose}>Hesap Oluştur</Button>
        </div>
      </div>
    </div>
  )
}

export default function AccountsPage() {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  const filtered = MOCK_ACCOUNTS.filter(a =>
    a.owner.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  const counts = {
    active:  MOCK_ACCOUNTS.filter(a => a.status === 'active').length,
    waiting: MOCK_ACCOUNTS.filter(a => a.status === 'waiting').length,
    locked:  MOCK_ACCOUNTS.filter(a => a.status === 'locked').length,
    captcha: MOCK_ACCOUNTS.filter(a => a.status === 'captcha').length,
  }

  return (
    <div className="space-y-6">
      {showModal && <AddAccountModal onClose={() => setShowModal(false)} />}

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Aktif',            value: counts.active,  icon: ShieldCheck,   color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' },
          { label: 'Bekliyor',         value: counts.waiting, icon: Clock,         color: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'         },
          { label: 'Kilitlendi',       value: counts.locked,  icon: Lock,          color: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'                 },
          { label: 'CAPTCHA Bekliyor', value: counts.captcha, icon: AlertTriangle,  color: 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400'    },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.color)}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablo */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tüm Hesaplar ({filtered.length})</h3>
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
              <Plus className="w-3 h-3" />Yeni Hesap
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {['Hesap Sahibi', 'İletişim', 'Ülke / Vize', 'Son Giriş', 'Durum', 'Oluşturuldu', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(account => {
                const sc = statusConfig[account.status]
                return (
                  <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{account.owner}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Mail className="w-3 h-3 flex-shrink-0" />{account.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 flex-shrink-0" />{account.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <span>{account.countryEmoji}</span>
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{account.country}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 block">{account.visaType}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />{account.lastLogin}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={sc.variant} dot>{sc.label}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {account.createdAt}
                    </td>
                    <td className="py-3.5 px-4 relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === account.id ? null : account.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === account.id && (
                        <div className="absolute right-4 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 py-1 min-w-[140px]">
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />Düzenle
                          </button>
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                          >
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
