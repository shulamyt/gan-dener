import { ParsedMessage, PaymentMethodLabel, PAYMENT_METHOD_ALIASES } from '../domain';
import { ParseError } from '../domain';

/**
 * Parses a WhatsApp message in the format:
 *   "<Name> <Amount> <PaymentMethod> [notes]"
 *
 * Examples:
 *   "Avitar Cohen 350 cash"
 *   "Noa Levi 420 bit"
 *   "Family Israeli 700 bank transfer"
 *   "Avitar Cohen 350 cash monthly fee"
 */
export class MessageParser {
  parse(text: string): ParsedMessage {
    const cleaned = text.trim().replace(/\s+/g, ' ');

    if (!cleaned) {
      throw new ParseError('Empty message');
    }

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

    return { name, amount, paymentMethod, notes: notes || undefined };
  }

  private extractPaymentMethod(text: string): {
    paymentMethod: PaymentMethodLabel;
    notes?: string;
  } {
    const lowerText = text.toLowerCase().replace(/₪/g, '').trim();

    if (!lowerText) {
      return { paymentMethod: PaymentMethodLabel.OTHER };
    }

    const sortedAliases = Object.keys(PAYMENT_METHOD_ALIASES).sort(
      (a, b) => b.length - a.length,
    );

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
