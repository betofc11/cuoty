import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types/database'

import { supabasePublishableKey, supabaseUrl } from './env'

/** Cliente para Client Components. Solo donde haga falta interactividad. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabasePublishableKey())
}
