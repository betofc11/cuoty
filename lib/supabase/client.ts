import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './env'

/** Cliente para Client Components. Solo donde haga falta interactividad. */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
}
