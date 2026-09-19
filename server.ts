import dotenv from 'dotenv';
dotenv.config({ override: true });

import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import backendApp, { notFoundHandler, globalErrorHandler } from './backend/src/app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  // Catch undefined /api routes so they return JSON 404 rather than HTML
  backendApp.all('/api/*', notFoundHandler);

  // Attach global error handler for API routes
  backendApp.use('/api', globalErrorHandler);

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    backendApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    backendApp.use(express.static(distPath));
    backendApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  backendApp.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Full-stack application running at http://localhost:${PORT}`);
    console.log(`📡 Backend API available at http://localhost:${PORT}/api/complaints`);
    console.log(`🩺 Health check at http://localhost:${PORT}/api/health`);
  });
}

startServer();
