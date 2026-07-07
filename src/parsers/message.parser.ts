import {
  ParsedMessage,
  ParsedPaymentMessage,
  ParsedBalanceSetMessage,
  MessageType,
  PaymentMethodLabel,
  PAYMENT_METHOD_ALIASES,
} from '../domain';
import { ParseError } from '../domain';

/**
 * Parses a WhatsApp message in the format:
 *   Payment: "<Name> <Amount> <PaymentMethod> [notes]"
 *   Balance Setting: "<Name> יש חוב של <Amount> שח" or similar patterns
 *
 * Payment Examples:
 *   "Avitar Cohen 350 cash"
 *   "Noa Levi 420 bit"
 *   "Family Israeli 700 bank transfer"
 *   "Avitar Cohen 350 cash monthly fee"
 *
 * Balance Setting Examples:
 *   "כהן יש חוב של 100 שח"
 *   "כהן יתרה -100"
 *   "כהן באלאנס -50"
 */
export class MessageParser {
  parse(text: string): ParsedMessage {
    const cleaned = text.trim().replace(/\s+/g, ' ');

    if (!cleaned) {
      throw new ParseError('Empty message');
    }

    // Check if this is a balance setting message
    const balanceSetMessage = this.tryParseBalanceSet(cleaned);
    if (balanceSetMessage) {
      return balanceSetMessage;
    }

    // Otherwise, parse as payment message
    return this.parsePayment(cleaned);
  }

  private tryParseBalanceSet(text: string): ParsedBalanceSetMessage | null {
    // Patterns for balance setting messages (Hebrew and English)
    // Order matters: more specific patterns first!
    const balancePatterns = [
      // "כהן יש חוב של 100 שח" or "כהן יש חוב של 100"
      /^(.+?)\s+יש\s+חוב\s+של\s+(\d+(?:[.,]\d+)?)\s*(?:שח|₪)?/i,
      // "כהן set balance -100" - must come before general "balance" pattern
      /^(.+?)\s+set\s+balance\s+(-?\d+(?:[.,]\d+)?)/i,
      // "כהן יתרה -100" or "כהן יתרה 100"
      /^(.+?)\s+יתרה\s+(-?\d+(?:[.,]\d+)?)/i,
      // "כהן באלאנס -100" or "כהן balance -100" - general balance pattern last
      /^(.+?)\s+(?:באלאנס|balance)\s+(-?\d+(?:[.,]\d+)?)/i,
    ];

    for (const pattern of balancePatterns) {
      const match = text.match(pattern);
      if (match) {
        const name = match[1].trim();
        const balanceStr = match[2].replace(',', '.');
        let balance = parseFloat(balanceStr);

        // For "חוב של" (debt) patterns, make the balance negative
        if (text.includes('חוב של') && balance > 0) {
          balance = -balance;
        }

        if (!name) {
          continue; // Try next pattern
        }

        if (isNaN(balance) || Math.abs(balance) > 100_000) {
          continue; // Try next pattern
        }

        return {
          type: MessageType.BALANCE_SET,
          name,
          balance,
          notes: undefined,
        };
      }
    }

    return null;
  }

  private parsePayment(cleaned: string): ParsedPaymentMessage {
    const amountMatch = cleaned.match(/(\d+(?:[.,]\d+)?)/);
    if (!amountMatch) {
      throw new ParseError(`Could not find an amount in: "${cleaned}"`);
    }

    const amountIndex = amountMatch.index!;
    const amountStr = amountMatch[1].replace(',', '.');
    const amount = parseFloat(amountStr);

    if (amount <= 0 || amount > 100_000) {
      throw new ParseError(`Invalid amount: ${amount}`);
    }

    const name = cleaned.substring(0, amountIndex).trim();
    if (!name) {
      throw new ParseError(`Could not find a name in: "${cleaned}"`);
    }

    const afterAmount = cleaned.substring(amountIndex + amountMatch[1].length).trim();
    const { paymentMethod, notes } = this.extractPaymentMethod(afterAmount);

    return {
      type: MessageType.PAYMENT,
      name,
      amount,
      paymentMethod,
      notes: notes || undefined,
    };
  }

  private extractPaymentMethod(text: string): {
    paymentMethod: PaymentMethodLabel;
    notes?: string;
  } {
    const lowerText = text.toLowerCase().replace(/₪/g, '').trim();

    if (!lowerText) {
      return { paymentMethod: PaymentMethodLabel.OTHER };
    }

    const sortedAliases = Object.keys(PAYMENT_METHOD_ALIASES).sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
      if (lowerText.startsWith(alias)) {
        const remaining = lowerText.substring(alias.length).trim();
        return {
          paymentMethod: PAYMENT_METHOD_ALIASES[alias],
          notes: remaining || undefined,
        };
      }
    }

    return {
      paymentMethod: PaymentMethodLabel.OTHER,
      notes: text.trim() || undefined,
    };
  }
}
