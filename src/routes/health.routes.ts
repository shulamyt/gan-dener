import { Router } from 'express';

export function createHealthRouter(healthController?: any): Router {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({ 
      success: true, 
      data: { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'gan-dener-api'
      } 
    });
  });

  return router;
}