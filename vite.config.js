import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// ESM 환경에서 __dirname 대체 (Vite 5 호환)
const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@':           r('src'),
      '@config':     r('src/config'),
      '@hooks':      r('src/hooks'),
      '@ctx':        r('src/context'),
      '@utils':      r('src/utils'),
      '@services':   r('src/services'),
      '@pages':      r('src/pages'),
      '@components': r('src/components'),
    },
    // .jsx 를 명시적으로 포함 (Vite 기본값이지만 안전을 위해 명시)
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },

  build: {
    outDir:   'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-three':    ['three'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },

  server: { port: 3000, open: true },
});
