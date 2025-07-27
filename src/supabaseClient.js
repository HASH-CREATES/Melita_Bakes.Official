import { createClient } from '@supabase/supabase-js';

// 1.  Paste your **real** values below – **no quotes around the keys**
const supabaseUrl  = 'https://<your-project>.supabase.co';
const supabaseAnonKey = '<your-anon-key>';

// 2.  Safety check
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
