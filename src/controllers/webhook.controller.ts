import { Request, Response } from 'express';
import { MessageHandlerService } from '../services';
import { logger } from '../lib';

interface TwilioWebhookBody {
  SmsMessageSid: string;
  NumMedia: string;
  ProfileName: string;
  MessageType: string;
  SmsSid: string;
  WaId: string;
  SmsStatus: string;
  Body: string;
  To: string;
  NumSegments: string;
  ReferralNumMedia: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
}

export class WebhookController {
  constructor(private readonly messageHandler: MessageHandlerService) {}

  async handleIncoming(req: Request, res: Response): Promise<void> {
    res.status(200).send('<Response></Response>');

    try {
      const body = req.body as TwilioWebhookBody;

      if (!body.Body || !body.From) {
        logger.debug('Ignoring webhook without body or sender');
        return;
      }

      const phone = body.WaId || body.From.replace('whatsapp:', '').replace('+', '');

      await this.messageHandler.handleIncomingMessage(phone, body.Body);
    } catch (error) {
      logger.error('Webhook processing error', { error });
    }
  }
}
