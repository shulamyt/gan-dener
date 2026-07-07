import { Request, Response } from 'express';
import { MessageHandlerService } from '../services';
import { WhatsAppWebhookPayload } from '../domain';
import { WhatsAppClient } from '../integrations';
import { logger } from '../lib';

export class WebhookController {
  constructor(
    private readonly messageHandler: MessageHandlerService,
    private readonly whatsapp: WhatsAppClient,
  ) {}

  async handleIncoming(req: Request, res: Response): Promise<void> {
    res.sendStatus(200);

    try {
      const payload = req.body as WhatsAppWebhookPayload;

      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const messages = change.value.messages ?? [];

          for (const message of messages) {
            if (message.type !== 'text' || !message.text?.body) {
              logger.debug('Ignoring non-text message', { type: message.type });
              continue;
            }

            await this.whatsapp.markAsRead(message.id);

            await this.messageHandler.handleIncomingMessage(
              message.from,
              message.text.body,
            );
          }
        }
      }
    } catch (error) {
      logger.error('Webhook processing error', { error });
    }
  }
}
