import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // ✨ 1. تم تغيير هذا السطر ليتوافق مع الحزم المثبتة
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // ✨ 2. هذا السطر مهم جدًا لـ Capacitor
  base: "./", 

  // ✨ 3. تم إعادة إعدادات الخادم التي كانت موجودة لديك
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

