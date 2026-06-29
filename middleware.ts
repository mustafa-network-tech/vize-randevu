import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aşağıdaki ile başlayan path'ler HARİÇ tüm istekleri yakala:
     * - _next/static  (statik dosyalar)
     * - _next/image   (resim optimizasyonu)
     * - favicon.ico, sitemap.xml vb.
     * - public klasörü
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
