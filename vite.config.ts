import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import precache from './scripts/precache-plugin.mjs'

export default defineConfig({ base: '/', plugins: [react(), precache()] })
