import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware içinde session token'ını yenileyen Supabase yardımcısı.
 * Env değişkenleri eksikse veya bağlantı başarısız olursa
 * istek sessizce devam ettirilir — site asla 500 vermez.
 */
export async function updateSession(request: NextRequest) {
  // Env değişkenleri henüz tanımlanmamışsa Supabase'i atla
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (
    !url || !key ||
    url === 'your-project-url-here' ||
    key === 'your-anon-key-here'
  ) {
    return NextResponse.next({ request })
  }

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(url, key, {
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
    })

    // Session'ı yenile (token süresi dolmuşsa refresh eder)
    const { data: { user } } = await supabase.auth.getUser()

    /*
     * Protected route mantığı buraya eklenecek. Örnek:
     *
     * const isProtected = request.nextUrl.pathname.startsWith('/dashboard')
     * if (isProtected && !user) {
     *   return NextResponse.redirect(new URL('/auth/login', request.url))
     * }
     */
    void user

    return supabaseResponse
  } catch {
    // Supabase bağlantı hatası → isteği engelleme, sadece devam et
    return NextResponse.next({ request })
  }
}
