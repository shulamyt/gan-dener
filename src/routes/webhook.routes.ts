import { Router } from 'express';
import { WebhookController } from '../controllers';
import { handleWebhookVerification } from '../middleware';

export function createWebhookRouter(controller: WebhookController): Router {
  const router = Router();

  router.get('/', handleWebhookVerification);
  router.post('/', (req, res) => controller.handleIncoming(req, res));

  return router;
}
