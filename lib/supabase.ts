import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("Supabase environment variables are not set.")
  // Fallback for development or if not using Supabase
  // You might want to throw an error or handle this more gracefully in production
}

// Client-side Supabase client (for RLS-enabled tables)
export const supabase = createClient(supabaseUrl || "http://localhost:54321", supabaseAnonKey || "dummy-anon-key")

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseServiceRoleKey || "dummy-service-role-key",
  {
    auth: {
      persistSession: false,
    },
  },
)
