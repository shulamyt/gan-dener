import { Router } from 'express';
import path from 'path';
import fs from 'fs';

export function createHealthRouter(healthController?: any): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const clientBuildExists = process.env.NODE_ENV === 'production' 
      ? fs.existsSync(path.join(__dirname, '../../client/dist/index.html'))
      : false;

    res.json({ 
      success: true, 
      data: { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'gan-dener-api',
        environment: process.env.NODE_ENV,
        clientBuild: clientBuildExists ? 'found' : 'not found'
      } 
    });
  });

  return router;
}