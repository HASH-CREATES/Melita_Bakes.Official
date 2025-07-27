import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Environment from 'vite-plugin-environment';

export default defineConfig({
  plugins: [
    react(),
    Environment(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'])
  ],
  base: '/',
  server: { port: 3000 },
  build: { outDir: 'dist' }
});
