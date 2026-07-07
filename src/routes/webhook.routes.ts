import { Router } from 'express';
import { WebhookController } from '../controllers';

export function createWebhookRouter(controller: WebhookController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.handleIncoming(req, res));

  return router;
}
