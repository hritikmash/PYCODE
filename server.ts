import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/apiHandler.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Permissive CORS & iframe headers to allow applet sharing & embedding in Google AI Studio
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  // Allow framing across Google AI Studio preview & all embedders
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.google.com https://*.googleusercontent.com https://*.run.app https://localhost.corp.google.com:26001 *"
  );
  res.removeHeader('X-Frame-Options');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check endpoints for Cloud Run & load balancers
app.get(['/health', '/_health', '/ping', '/api/health'], (_req, res) => {
  res.status(200).send('OK');
});

// API endpoints
app.use('/api', apiRouter);

// Strict API 404 handler: Any unhandled /api/* request must return JSON, NEVER index.html
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Frontend static serving & Vite Dev Server handling
const distPath = path.resolve(process.cwd(), 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');

// In development, mount Vite middleware so viewers always get live compiled modules
if (!isProduction) {
  try {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite development middleware on Express');
  } catch (err) {
    console.error('Failed to start Vite middleware, falling back to static build:', err);
  }
}

// Serve static production build if in production OR as fallback
if (fs.existsSync(distPath)) {
  // Static assets with cache headers
  app.use(
    express.static(distPath, {
      index: false,
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    })
  );

  // Missing asset handler - DO NOT return index.html for missing JS/CSS/image assets!
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/assets/') ||
      /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|map)$/i.test(req.path)
    ) {
      return res.status(404).type('text/plain').send('Asset not found');
    }
    next();
  });

  // SPA fallback for HTML navigation
  app.get('*', (_req, res) => {
    if (fs.existsSync(indexHtmlPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexHtmlPath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).send('Error rendering Pycode app');
        }
      });
    } else {
      res.status(404).send('Application build not found.');
    }
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pycode server is running on http://0.0.0.0:${PORT}`);
});
