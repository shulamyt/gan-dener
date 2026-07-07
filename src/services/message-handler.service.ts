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
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('🔄 Starting message processing', { 
      messageId,
      from: fromPhone, 
      text: messageText,
      textLength: messageText.length 
    });

    try {
      // Step 1: Get or create tenant
      logger.debug('📋 Getting tenant', { messageId, phone: fromPhone });
      const tenant = await this.tenantService.getOrCreate(fromPhone);
      logger.debug('✅ Tenant resolved', { messageId, tenantId: tenant.id, isNew: !tenant.id });

      // Step 2: Parse message
      logger.debug('🔍 Parsing message', { messageId, text: messageText });
      const parsed = this.parser.parse(messageText);
      logger.debug('✅ Message parsed', { 
        messageId, 
        parsed: {
          name: parsed.name,
          amount: parsed.amount,
          paymentMethod: parsed.paymentMethod,
          notes: parsed.notes
        }
      });

      // Step 3: Find child
      logger.debug('👶 Finding child', { messageId, tenantId: tenant.id, childName: parsed.name });
      const child = await this.childService.findByName(tenant.id, parsed.name);
      logger.debug('✅ Child found', { messageId, childId: child.id, childName: child.name });

      // Step 4: Record payment
      logger.debug('💰 Recording payment', { 
        messageId,
        payment: {
          tenantId: tenant.id,
          childId: child.id,
          childName: child.name,
          amount: parsed.amount,
          paymentMethod: parsed.paymentMethod
        }
      });
      
      const result = await this.paymentService.recordPayment({
        tenantId: tenant.id,
        childId: child.id,
        childName: child.name,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod,
        notes: parsed.notes,
      });
      
      logger.debug('✅ Payment recorded', { 
        messageId, 
        paymentId: result.paymentId,
        newBalance: result.newBalance 
      });

      // Step 5: Send confirmation
      const confirmationMessage = this.formatConfirmation(result);
      logger.debug('📤 Sending confirmation', { 
        messageId, 
        to: fromPhone,
        message: confirmationMessage 
      });
      
      await this.whatsapp.sendMessage(fromPhone, confirmationMessage);
      logger.debug('✅ Confirmation sent', { messageId });

      // Step 6: Sync to sheets (if configured)
      if (this.sheets) {
        logger.debug('📊 Syncing to Google Sheets', { messageId });
        await this.syncToSheets(tenant.id, result).catch((err) => {
          logger.error('❌ Failed to sync to Google Sheets', { messageId, error: err });
        });
        logger.debug('✅ Synced to Google Sheets', { messageId });
      } else {
        logger.debug('📊 Google Sheets not configured, skipping sync', { messageId });
      }

      logger.info('🎉 Message processed successfully', { 
        messageId, 
        paymentId: result.paymentId,
        childName: result.childName,
        amount: result.amount,
        newBalance: result.newBalance
      });
      
    } catch (error) {
      logger.error('❌ Error processing message', { 
        messageId,
        from: fromPhone,
        text: messageText,
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error
      });

      // Send error reply
      try {
        const reply = this.formatErrorReply(error);
        logger.debug('📤 Sending error reply', { messageId, to: fromPhone, reply });
        await this.whatsapp.sendMessage(fromPhone, reply);
        logger.debug('✅ Error reply sent', { messageId });
      } catch (replyError) {
        logger.error('❌ Failed to send error reply', { 
          messageId,
          to: fromPhone,
          originalError: error,
          replyError: replyError instanceof Error ? {
            message: replyError.message,
            stack: replyError.stack,
            name: replyError.name
          } : replyError
        });
      }
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
