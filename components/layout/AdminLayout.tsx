'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':     { title: 'Dashboard',           subtitle: 'Genel sistem durumu ve özet görünüm'                 },
  '/bots':          { title: 'Botlar',               subtitle: 'VFS bot yönetimi ve gerçek zamanlı izleme'          },
  '/countries':     { title: 'Ülkeler',              subtitle: 'İzlenen ülkeler ve vize kategorileri'              },
  '/applications':  { title: 'Başvurular',           subtitle: 'Müşteri vize başvuru takip sistemi'                },
  '/appointments':  { title: 'Randevular',           subtitle: 'Bulunan ve rezerve edilen randevular'              },
  '/logs':          { title: 'Sistem Logları',       subtitle: 'Detaylı bot aktivite ve sistem kayıtları'          },
  '/accounts':      { title: 'Hesap Yönetimi',       subtitle: 'VFS bot hesapları ve müşteri profilleri'           },
  '/proxy':         { title: 'Proxy Yönetimi',       subtitle: 'IP havuzu, sağlık durumu ve bot atamaları'         },
  '/captcha':       { title: 'CAPTCHA Yönetimi',     subtitle: 'Bekleyen çözümler ve performans istatistikleri'    },
  '/scheduler':     { title: 'Görev Zamanlayıcı',    subtitle: 'Bot çalışma takvimleri ve otomasyon planlaması'    },
  '/analytics':     { title: 'Analitik',             subtitle: 'Performans grafikleri ve istatistiksel analizler'  },
  '/notifications': { title: 'Bildirim Merkezi',     subtitle: 'Kanal yapılandırması ve uyarı tercihleri'          },
  '/users':         { title: 'Personel Yönetimi',    subtitle: 'Kullanıcı rolleri ve erişim yetkileri'             },
  '/settings':      { title: 'Sistem Ayarları',      subtitle: 'Yapılandırma, güvenlik ve yedekleme ayarları'      },
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const meta = PAGE_META[pathname] ?? { title: 'Vize Randevu', subtitle: '' }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
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
