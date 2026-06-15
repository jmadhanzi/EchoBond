import { createClient, SupabaseClient } from '@supabase/supabase-js'

function makeClient(url: string, key: string, opts?: object): SupabaseClient {
  return createClient(url, key, opts)
}

// Lazy singleton — only instantiated on first property access, not at import time
function lazy(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | undefined
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      if (!instance) instance = factory()
      return (instance as unknown as Record<string | symbol, unknown>)[prop]
    },
  })
}

// Browser-safe client (anon key)
export const supabase = lazy(() =>
  makeClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  ),
)

// Server-only admin client (service role key)
export const supabaseAdmin = lazy(() =>
  makeClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  ),
)
