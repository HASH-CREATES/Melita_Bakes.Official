import { createClient } from '@supabase/supabase-js';

const url  = process.env.VITE_SUPABASE_URL;
const key  = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing env vars');
}

export const supabase = createClient(url, key);
