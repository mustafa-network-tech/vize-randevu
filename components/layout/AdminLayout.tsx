'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Genel sistem durumu ve özet görünüm' },
  '/bots': { title: 'Botlar', subtitle: 'VFS bot yönetimi ve gerçek zamanlı izleme' },
  '/countries': { title: 'Ülkeler', subtitle: 'İzlenen ülkeler ve vize kategorileri' },
  '/applications': { title: 'Başvurular', subtitle: 'Müşteri vize başvuru takip sistemi' },
  '/appointments': { title: 'Randevular', subtitle: 'Bulunan ve rezerve edilen randevular' },
  '/logs': { title: 'Sistem Logları', subtitle: 'Detaylı bot aktivite ve sistem kayıtları' },
  '/accounts': { title: 'VFS Hesapları', subtitle: 'VFS Global hesap yönetimi' },
  '/settings': { title: 'Ayarlar', subtitle: 'Sistem yapılandırma ve bildirim ayarları' },
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const meta = PAGE_META[pathname] ?? { title: 'Vize Randevu', subtitle: '' }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
