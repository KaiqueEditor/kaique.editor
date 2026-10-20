import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { organizeText } from './server/organize';
import react from '@vitejs/plugin-react';

/**
 * Teste local da organização automática: POST /api/organize só existe no
 * servidor de desenvolvimento, e a chave do OpenRouter fica no Node (.env.local).
 */
function organizeApi(env: Record<string, string>): Plugin {
  return {
    name: 'organize-api',
    configureServer(server) {
      server.middlewares.use('/api/organize', async (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{"error":"use POST"}'); return; }
        try {
          let body = '';
          for await (const chunk of req) body += chunk;
          const { text, mode } = JSON.parse(body || '{}');
          const result = await organizeText(String(text ?? ''), mode === 'x' ? 'x' : 'feed', env);
          res.end(JSON.stringify(result));
        } catch (e) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'falha ao organizar' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: '.',
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
    },
    plugins: [react(), organizeApi(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react'],
            'export-vendor': ['html-to-image', 'jszip', 'file-saver'],
          },
        },
      },
    },
  };
});
