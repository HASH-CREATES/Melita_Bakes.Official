import { createClient } from '@supabase/supabase-js';

// Render exposes env vars at runtime via window.ENV
// If not set, fall back to the VITE_* ones (local dev)
const supabaseUrl =
  window.ENV?.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  window.ENV?.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
