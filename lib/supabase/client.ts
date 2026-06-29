import { createBrowserClient } from '@supabase/ssr'

/**
 * Tarayıcı (client component) tarafında kullanılan Supabase istemcisi.
 * 'use client' bileşenlerinde çağrılır.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
