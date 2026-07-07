import twilio from 'twilio';
import { logger } from '../lib';

export interface WhatsAppProvider {
  sendMessage(to: string, text: string): Promise<void>;
}

export class TwilioWhatsAppClient implements WhatsAppProvider {
  private readonly client: ReturnType<typeof twilio>;
  private readonly fromNumber: string;

  constructor(accountSid: string, authToken: string, fromNumber: string) {
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
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
        errorCode: error instanceof Error && 'code' in error ? (error as any).code : null,
        errorStatus: error instanceof Error && 'status' in error ? (error as any).status : null,
      });
      
      // Provide specific guidance for common WhatsApp errors
      if (error instanceof Error) {
        if (error.message.includes('Channel with the specified From address')) {
          logger.error('WhatsApp sender not configured in Twilio. Please check:', {
            suggestion: 'Verify that the number is registered as WhatsApp Business API sender in Twilio Console',
            fromNumber: this.fromNumber,
            twilioConsoleUrl: 'https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders'
          });
        }
      }
      
      throw error;
    }
  }
}
