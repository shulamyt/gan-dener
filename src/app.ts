import express from 'express';
import { AppContainer } from './container';
import { requestLogger, errorHandler } from './middleware';
import { createWebhookRouter, createHealthRouter } from './routes';

export function createApp(container: AppContainer): express.Application {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.use('/webhook', createWebhookRouter(container.webhookController));
  app.use('/health', createHealthRouter(container.healthController));

  app.use(errorHandler);

  return app;
}
