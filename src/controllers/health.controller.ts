import { Request, Response } from 'express';

export class HealthController {
  handle(_req: Request, res: Response): void {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
}
