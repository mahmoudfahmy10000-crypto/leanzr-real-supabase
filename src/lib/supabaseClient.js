import { createClient } from "@supabase/supabase-js";

export function hasSupabaseEnv() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export function getSupabase() {
  if (!hasSupabaseEnv()) return null;
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}
