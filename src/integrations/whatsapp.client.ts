import axios, { AxiosInstance } from 'axios';
import { logger } from '../lib';

export class WhatsAppClient {
  private readonly http: AxiosInstance;

  constructor(apiUrl: string, phoneNumberId: string, accessToken: string) {
    this.http = axios.create({
      baseURL: `${apiUrl}/${phoneNumberId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(to: string, text: string): Promise<void> {
    try {
      await this.http.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: text },
      });
      logger.debug('WhatsApp message sent', { to });
    } catch (error) {
      logger.error('Failed to send WhatsApp message', {
        to,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.http.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
    } catch (_error) {
      logger.warn('Failed to mark message as read', { messageId });
    }
  }
}
