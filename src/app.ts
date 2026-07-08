import express from 'express';
import path from 'path';
import { AppContainer } from './container';
import { requestLogger, errorHandler } from './middleware';
import { createWebhookRouter, createHealthRouter, createBalanceHistoryRouter, createApiRouter } from './routes';

export function createApp(container: AppContainer): express.Application {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(requestLogger);

  // CORS for development and production
  app.use((req, res, next) => {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://gan-dener.onrender.com']
      : ['http://localhost:3001', 'http://localhost:3002'];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin || '')) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // API routes
  app.use('/webhook', createWebhookRouter(container.webhookController));
  app.use('/health', createHealthRouter());
  app.use('/api', createApiRouter(container));
  app.use('/api/balance-history', createBalanceHistoryRouter(container.balanceHistoryController));

  // Serve static files from client build in production
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
    
    // Serve static files
    app.use(express.static(clientBuildPath));
    
    // Serve React app for all non-API routes (SPA fallback)
    app.get('*', (req, res, next) => {
      // Skip if it's an API route
      if (req.path.startsWith('/api') || req.path.startsWith('/webhook') || req.path.startsWith('/health')) {
        return next();
      }
      
      res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Error loading application');
        }
      });
    });
  } else {
    // Development root route
    app.get('/', (_, res) => {
      res.json({ 
        message: 'Gan Dener API - Development Mode', 
        frontend: 'http://localhost:3002',
        health: '/health',
        api: '/api'
      });
    });
  }

  app.use(errorHandler);

  return app;
}
