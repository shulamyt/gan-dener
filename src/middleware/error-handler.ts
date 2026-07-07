import { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain';
import { logger } from '../lib';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn('Operational error', {
      status: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
}
