import { Request, Response } from 'express';
import { env } from '../config';
import { logger } from '../lib';

export function handleWebhookVerification(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
    logger.info('Webhook verified');
    res.status(200).send(challenge);
    return;
  }

  logger.warn('Webhook verification failed', { mode, token });
  res.sendStatus(403);
}
