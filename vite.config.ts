import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import precache from './scripts/precache-plugin.mjs'

export default defineConfig({ base: '/', plugins: [react(), precache()], // xfwd: نشانی اصلی (Host/Origin) را به API می‌رساند تا بررسی هم‌مبدأ‌بودنِ درخواست‌های ورود در توسعه هم کار کند
  server: { proxy: { '/api': { target: 'http://localhost:3000', xfwd: true } } } })
