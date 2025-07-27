import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = 'https://cyknvmjspyblbdbdcuei.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a252bWpzcHlibGJkYmRjdWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODUwODksImV4cCI6MjA2NjM2MTA4OX0.cpbgOl6S9kKdXMs3HVIeyggItNaFZVyAfQ3BH9u0qh0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
