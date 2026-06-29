import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware içinde session token'ını yenileyen Supabase yardımcısı.
 * Ana middleware.ts dosyasından çağrılır.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Kullanıcı session'ını yenile (token süresi dolmuşsa refresh eder)
  const { data: { user } } = await supabase.auth.getUser()

  /*
   * Protected route mantığı buraya eklenecek.
   * Örnek:
   *
   * const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
   * if (isProtected && !user) {
   *   return NextResponse.redirect(new URL('/auth/login', request.url))
   * }
   */
  void user // şimdilik kullanılmıyor, ileride kontrol için hazır

  return supabaseResponse
}
