import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase credentials missing. Image uploads will not work. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
  }
}

// We use a dummy URL if missing to prevent createClient from throwing during build
// The client won't work for actual requests, but it will allow the build to complete
const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co'
const effectiveKey = supabaseAnonKey || 'placeholder'

export const supabase = createClient(effectiveUrl, effectiveKey)
