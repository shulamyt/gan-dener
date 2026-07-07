import { MessageParser } from '../parsers';
import { TenantService } from './tenant.service';
import { FamilyService } from './family.service';
import { PaymentService } from './payment.service';
import { GoogleSheetsIntegration } from '../integrations/google-sheets.integration';
import { WhatsAppProvider } from '../integrations/whatsapp.client';
import { logger } from '../lib';
import { AppError, ParseError, ChildNotFoundError, TransactionResult, BalanceSetResult, MessageType, ParsedPaymentMessage, ParsedBalanceSetMessage } from '../domain';
import { FamilyWithMembers } from '../repositories/family.repository';

export class MessageHandlerService {
  constructor(
    private readonly parser: MessageParser,
    private readonly tenantService: TenantService,
    private readonly familyService: FamilyService,
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
          type: parsed.type,
          name: parsed.name,
          ...(parsed.type === MessageType.PAYMENT ? {
            amount: (parsed as any).amount,
            paymentMethod: (parsed as any).paymentMethod,
            notes: (parsed as any).notes
          } : {
            balance: (parsed as any).balance,
            notes: (parsed as any).notes
          })
        }
      });

      // Step 3: Find family by member name (child or parent)
      logger.debug('👨‍👩‍👧‍👦 Finding family by member name', { messageId, tenantId: tenant.id, memberName: parsed.name });
      const family = await this.familyService.findFamilyByMemberName(tenant.id, parsed.name);
      
      if (!family) {
        const suggestions = await this.familyService.getFamilyMemberSuggestions(tenant.id);
        throw new ChildNotFoundError(parsed.name, suggestions);
      }
      
      logger.debug('✅ Family found', { messageId, familyId: family.id, familyName: family.lastName });

      // Step 4: Process based on message type
      if (parsed.type === MessageType.PAYMENT) {
        const result = await this.processPayment(messageId, tenant.id, family, parsed as ParsedPaymentMessage);
        const confirmationMessage = this.formatPaymentConfirmation(result);
        
        await this.whatsapp.sendMessage(fromPhone, confirmationMessage);
        
        if (this.sheets) {
          await this.syncToSheets(tenant.id, result).catch((err) => {
            logger.error('❌ Failed to sync to Google Sheets', { messageId, error: err });
          });
        }

        logger.info('🎉 Payment processed successfully', { 
          messageId, 
          paymentId: result.paymentId,
          familyInfo: result.childName,
          amount: result.amount,
          newBalance: result.newBalance
        });
      } else if (parsed.type === MessageType.BALANCE_SET) {
        const result = await this.processBalanceSet(messageId, tenant.id, family, parsed as ParsedBalanceSetMessage);
        const confirmationMessage = this.formatBalanceSetConfirmation(result);
        
        await this.whatsapp.sendMessage(fromPhone, confirmationMessage);

        logger.info('🎉 Balance set successfully', { 
          messageId, 
          familyName: result.familyName,
          oldBalance: result.oldBalance,
          newBalance: result.newBalance,
          setBy: result.setBy
        });
      }
      
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

  private async processPayment(
    messageId: string,
    tenantId: string, 
    family: FamilyWithMembers, 
    parsed: ParsedPaymentMessage
  ): Promise<TransactionResult> {
    logger.debug('💰 Recording payment for family', { 
      messageId,
      payment: {
        tenantId,
        familyId: family.id,
        familyName: family.lastName,
        paidFor: parsed.name,
        amount: parsed.amount,
        paymentMethod: parsed.paymentMethod
      }
    });
    
    const result = await this.paymentService.recordPaymentForFamily({
      tenantId,
      familyId: family.id,
      familyName: family.lastName,
      paidFor: parsed.name,
      amount: parsed.amount,
      paymentMethod: parsed.paymentMethod,
      notes: parsed.notes,
    });
    
    logger.debug('✅ Payment recorded', { 
      messageId, 
      paymentId: result.paymentId,
      newBalance: result.newBalance 
    });

    return result;
  }

  private async processBalanceSet(
    messageId: string,
    tenantId: string, 
    family: FamilyWithMembers, 
    parsed: ParsedBalanceSetMessage
  ): Promise<BalanceSetResult> {
    logger.debug('⚖️ Setting balance for family', { 
      messageId,
      balanceSet: {
        tenantId,
        familyId: family.id,
        familyName: family.lastName,
        newBalance: parsed.balance,
        setBy: parsed.name
      }
    });
    
    const result = await this.paymentService.setFamilyBalance({
      familyId: family.id,
      familyName: family.lastName,
      newBalance: parsed.balance,
      setBy: parsed.name,
      notes: parsed.notes,
    });
    
    logger.debug('✅ Balance set', { 
      messageId, 
      familyName: result.familyName,
      oldBalance: result.oldBalance,
      newBalance: result.newBalance
    });

    return result;
  }

  private formatPaymentConfirmation(result: TransactionResult): string {
    return [
      `תשלום נרשם בהצלחה ✅`,
      `  משפחה/אדם: ${result.childName}`,
      `  סכום: ${result.amount}₪`,
      `  אמצעי תשלום: ${result.paymentMethod}`,
      `  יתרה משפחתית: ${result.newBalance}₪`,
    ].join('\n');
  }

  private formatBalanceSetConfirmation(result: BalanceSetResult): string {
    return [
      `יתרה עודכנה בהצלחה ✅`,
      `  משפחה: ${result.familyName}`,
      `  יתרה קודמת: ${result.oldBalance}₪`,
      `  יתרה חדשה: ${result.newBalance}₪`,
      result.setBy ? `  עודכן על ידי: ${result.setBy}` : '',
    ].filter(Boolean).join('\n');
  }

  private formatErrorReply(error: unknown): string {
    if (error instanceof ChildNotFoundError) {
      if (error.suggestions.length > 0) {
        const names = error.suggestions.slice(0, 5).join(', '); // Limit to 5 suggestions
        return `לא מצאתי את האדם/הילד - אולי התכוונת ל: ${names}?`;
      }
      return 'לא מצאתי את האדם/הילד. אין משפחות רשומות עדיין.';
    }

    if (error instanceof ParseError) {
      return [
        'לא הצלחתי להבין את ההודעה.',
        'יש לשלוח בפורמט:',
        '  <שם> <סכום> <אמצעי תשלום>',
        'לדוגמה: "כהן 350 מזומן" או "שרה כהן 350 מזומן"',
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
        childName: result.childName, // This now contains family + member info
        amount: result.amount,
        paymentMethod: result.paymentMethod,
        balance: result.newBalance,
      });
  }
}
