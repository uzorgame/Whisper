import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // відносні шляхи — щоб та сама збірка працювала і на GitHub Pages у підкаталозі
  base: './',
  server: {
    port: 5181,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // transformers.js сам підтягує onnxruntime-web, pre-bundling його ламає
    exclude: ['@huggingface/transformers'],
  },
})
