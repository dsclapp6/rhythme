import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: '127.0.0.1', cors: false },
  preview: { port: 3000, host: '127.0.0.1' },
  build: {
    outDir: 'dist', sourcemap: false, minify: 'esbuild', target: 'es2015',
    rollupOptions: { output: { manualChunks: {
      vendor: ['react', 'react-dom'], icons: ['lucide-react']
    } } }
  },
  resolve: { alias: Object.fromEntries(Object.entries({
    '@': './src', '@components': './src/Components', '@hooks': './src/Hooks',
    '@utils': './src/Utilities', '@constants': './src/Constants'
  }).map(([alias, path]) => [alias, fileURLToPath(new URL(path, import.meta.url))])) },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.{js,jsx}'], setupFiles: ['./tests/setup.js'] }
});
