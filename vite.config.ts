import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  console.log("--- VITE CONFIG DEBUG ---");
  console.log("VITE_GEMINI_API_KEY present:", !!env.VITE_GEMINI_API_KEY);
  console.log("GEMINI_API_KEY present:", !!env.GEMINI_API_KEY);
  console.log("Key Length:", (env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '').length);
  console.log("-------------------------");
  return {
    base: '/Gen/',  // GitHub Pages path
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
