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

  // CORS for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use('/webhook', createWebhookRouter(container.webhookController));
  app.use('/health', createHealthRouter(container.healthController));
  app.use('/api', createApiRouter(container));
  app.use('/api/balance-history', createBalanceHistoryRouter(container.balanceHistoryController));

  // Serve static files from client build in production
  if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist');
    app.use(express.static(clientBuildPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}
