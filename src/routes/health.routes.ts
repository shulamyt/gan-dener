import { Router } from 'express';
import { HealthController } from '../controllers';

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();

  router.get('/', (req, res) => controller.handle(req, res));

  return router;
}
