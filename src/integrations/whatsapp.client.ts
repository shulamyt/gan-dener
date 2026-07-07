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
    try {
      await this.client.messages.create({
        body: text,
        from: `whatsapp:${this.fromNumber}`,
        to: toFormatted,
      });
      logger.debug('WhatsApp message sent via Twilio', { to });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        to,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}
