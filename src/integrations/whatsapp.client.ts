import twilio from 'twilio';
import { logger } from '../lib';

export interface WhatsAppProvider {
  sendMessage(to: string, text: string): Promise<void>;
}

interface ErrorWithCode extends Error {
  code?: string | number;
  status?: number;
}

function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return error instanceof Error && 'code' in error;
}

function isErrorWithStatus(error: unknown): error is ErrorWithCode {
  return error instanceof Error && 'status' in error;
}

export class TwilioWhatsAppClient implements WhatsAppProvider {
  private readonly client: ReturnType<typeof twilio>;
  private readonly fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;

    // Validate WhatsApp sender configuration on startup
    this.validateWhatsAppSender().catch((error) => {
      logger.warn('⚠️ WhatsApp sender validation failed', {
        fromNumber: this.fromNumber,
        error: error instanceof Error ? error.message : error,
        suggestion: 'Check Twilio Console → Messaging → Senders → WhatsApp senders',
      });
    });
  }

  private async validateWhatsAppSender(): Promise<void> {
    try {
      // Try to get WhatsApp senders to validate configuration
      const senders = await this.client.messaging.v1.services.list({ limit: 1 });
      logger.info('✅ Twilio client initialized', {
        fromNumber: this.fromNumber,
        servicesFound: senders.length,
      });
    } catch (error) {
      logger.warn('Could not validate WhatsApp configuration', {
        fromNumber: this.fromNumber,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async sendMessage(to: string, text: string): Promise<void> {
    const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:+${to.replace(/\D/g, '')}`;
    const fromFormatted = `whatsapp:${this.fromNumber}`;

    try {
      await this.client.messages.create({
        body: text,
        from: fromFormatted,
        to: toFormatted,
      });
      logger.debug('WhatsApp message sent via Twilio', { to, from: fromFormatted });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        to: toFormatted,
        from: fromFormatted,
        fromNumber: this.fromNumber,
        error: error instanceof Error ? error.message : error,
        errorCode: isErrorWithCode(error) ? error.code : null,
        errorStatus: isErrorWithStatus(error) ? error.status : null,
      });

      // Provide specific guidance for common WhatsApp errors
      if (error instanceof Error) {
        if (error.message.includes('Channel with the specified From address')) {
          logger.error('WhatsApp sender not configured in Twilio. Please check:', {
            suggestion:
              'Verify that the number is registered as WhatsApp Business API sender in Twilio Console',
            fromNumber: this.fromNumber,
            twilioConsoleUrl: 'https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders',
          });
        }
      }

      throw error;
    }
  }
}
