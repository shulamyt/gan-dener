export enum PaymentMethodLabel {
  CASH = 'cash',
  BIT = 'bit',
  BANK_TRANSFER = 'bank transfer',
  CREDIT_CARD = 'credit card',
  CHECK = 'check',
  OTHER = 'other',
}

export const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethodLabel> = {
  cash: PaymentMethodLabel.CASH,
  מזומן: PaymentMethodLabel.CASH,

  bit: PaymentMethodLabel.BIT,
  ביט: PaymentMethodLabel.BIT,

  'bank transfer': PaymentMethodLabel.BANK_TRANSFER,
  'העברה בנקאית': PaymentMethodLabel.BANK_TRANSFER,
  העברה: PaymentMethodLabel.BANK_TRANSFER,
  transfer: PaymentMethodLabel.BANK_TRANSFER,

  'credit card': PaymentMethodLabel.CREDIT_CARD,
  credit: PaymentMethodLabel.CREDIT_CARD,
  'כרטיס אשראי': PaymentMethodLabel.CREDIT_CARD,
  אשראי: PaymentMethodLabel.CREDIT_CARD,

  check: PaymentMethodLabel.CHECK,
  "צ'ק": PaymentMethodLabel.CHECK,
  צק: PaymentMethodLabel.CHECK,
};

export interface ParsedMessage {
  name: string;
  amount: number;
  paymentMethod: PaymentMethodLabel;
  notes?: string;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppIncomingMessage[];
      };
      field: string;
    }>;
  }>;
}

export interface TransactionResult {
  paymentId: string;
  childName: string;
  amount: number;
  paymentMethod: string;
  newBalance: number;
}
