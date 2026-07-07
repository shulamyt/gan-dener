import { MessageParser } from '../parsers';
import { TenantService } from './tenant.service';
import { ChildService } from './child.service';
import { PaymentService } from './payment.service';
import { GoogleSheetsIntegration } from '../integrations/google-sheets.integration';
import { WhatsAppProvider } from '../integrations/whatsapp.client';
import { logger } from '../lib';
import { AppError, ParseError, ChildNotFoundError, TransactionResult } from '../domain';

export class MessageHandlerService {
  constructor(
    private readonly parser: MessageParser,
    private readonly tenantService: TenantService,
    private readonly childService: ChildService,
    private readonly paymentService: PaymentService,
    private readonly whatsapp: WhatsAppProvider,
    private readonly sheets: GoogleSheetsIntegration | null,
  ) {}

  async handleIncomingMessage(fromPhone: string, messageText: string): Promise<void> {
    logger.info('Processing message', { from: fromPhone, text: messageText });

    try {
      const tenant = await this.tenantService.getOrCreate(fromPhone);

      const parsed = this.parser.parse(messageText);

      const child = await this.childService.findByName(tenant.id, parsed.name);

      const result = await this.paymentService.recordPayment({
        tenantId: tenant.id,
        childId: child.id,
        childName: child.name,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod,
        notes: parsed.notes,
      });

      await this.whatsapp.sendMessage(fromPhone, this.formatConfirmation(result));

      if (this.sheets) {
        await this.syncToSheets(tenant.id, result).catch((err) => {
          logger.error('Failed to sync to Google Sheets', { error: err });
        });
      }

      logger.info('Message processed successfully', { paymentId: result.paymentId });
    } catch (error) {
      const reply = this.formatErrorReply(error);
      await this.whatsapp.sendMessage(fromPhone, reply);
      logger.error('Error processing message', { error, from: fromPhone });
    }
  }

  private formatConfirmation(result: TransactionResult): string {
    return [
      `תשלום נרשם בהצלחה ✅`,
      `  שם: ${result.childName}`,
      `  סכום: ${result.amount}₪`,
      `  אמצעי תשלום: ${result.paymentMethod}`,
      `  יתרה: ${result.newBalance}₪`,
    ].join('\n');
  }

  private formatErrorReply(error: unknown): string {
    if (error instanceof ChildNotFoundError) {
      if (error.suggestions.length > 0) {
        const names = error.suggestions.join(', ');
        return `לא מצאתי את הילד - אולי התכוונת ל${names}?`;
      }
      return 'לא מצאתי את הילד. אין ילדים רשומים עדיין.';
    }

    if (error instanceof ParseError) {
      return [
        'לא הצלחתי להבין את ההודעה.',
        'יש לשלוח בפורמט:',
        '  <שם> <סכום> <אמצעי תשלום>',
        'לדוגמה: "אביתר כהן 350 מזומן"',
      ].join('\n');
    }

    if (error instanceof AppError && error.isOperational) {
      return `שגיאה: ${error.message}`;
    }

    return 'אירעה שגיאה. נסו שוב מאוחר יותר.';
  }

  private async syncToSheets(
    _tenantId: string,
    result: TransactionResult,
  ): Promise<void> {
    if (!this.sheets) return;
    await this.sheets.appendPaymentRow({
      date: new Date().toISOString(),
      childName: result.childName,
      amount: result.amount,
      paymentMethod: result.paymentMethod,
      balance: result.newBalance,
    });
  }
}
