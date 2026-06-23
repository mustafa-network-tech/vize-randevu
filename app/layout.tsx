import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AdminLayout } from '@/components/layout/AdminLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vize Randevu — Yönetim Paneli',
  description: 'VFS randevu takip ve otomasyon yönetim sistemi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <AdminLayout>{children}</AdminLayout>
      </body>
    </html>
  )
}
