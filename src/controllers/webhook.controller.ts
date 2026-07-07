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
    // Log the raw incoming webhook data
    logger.info('📨 Incoming WhatsApp webhook', {
      headers: {
        'content-type': req.headers['content-type'],
        'x-twilio-signature': req.headers['x-twilio-signature'] ? 'present' : 'missing',
        'user-agent': req.headers['user-agent']
      },
      body: req.body,
      method: req.method,
      url: req.url
    });

    res.status(200).send('<Response></Response>');

    try {
      const body = req.body as TwilioWebhookBody;

      // Enhanced validation with detailed logging
      if (!body.Body || !body.From) {
        logger.warn('⚠️ Invalid webhook: missing required fields', {
          hasBody: !!body.Body,
          hasFrom: !!body.From,
          messageType: body.MessageType,
          smsStatus: body.SmsStatus,
          receivedFields: Object.keys(body)
        });
        return;
      }

      // Extract and log phone number processing
      const rawPhone = body.WaId || body.From;
      const phone = rawPhone.replace('whatsapp:', '').replace('+', '');
      
      logger.info('📱 Processing WhatsApp message', {
        messageId: body.MessageSid || body.SmsMessageSid,
        from: {
          raw: body.From,
          waId: body.WaId,
          processed: phone
        },
        message: {
          body: body.Body,
          type: body.MessageType,
          status: body.SmsStatus
        },
        profile: {
          name: body.ProfileName
        },
        metadata: {
          to: body.To,
          accountSid: body.AccountSid,
          numSegments: body.NumSegments
        }
      });

      // Process the message
      const startTime = Date.now();
      await this.messageHandler.handleIncomingMessage(phone, body.Body);
      const processingTime = Date.now() - startTime;

      logger.info('✅ Message processed successfully', {
        messageId: body.MessageSid || body.SmsMessageSid,
        phone,
        processingTimeMs: processingTime
      });

    } catch (error) {
      logger.error('❌ Webhook processing error', { 
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        body: req.body
      });
    }
  }
}
