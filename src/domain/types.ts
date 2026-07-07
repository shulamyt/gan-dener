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

export enum MessageType {
  PAYMENT = 'payment',
  BALANCE_SET = 'balance_set'
}

export interface ParsedPaymentMessage {
  type: MessageType.PAYMENT;
  name: string;
  amount: number;
  paymentMethod: PaymentMethodLabel;
  notes?: string;
}

export interface ParsedBalanceSetMessage {
  type: MessageType.BALANCE_SET;
  name: string;
  balance: number;
  notes?: string;
}

export type ParsedMessage = ParsedPaymentMessage | ParsedBalanceSetMessage;

export interface TransactionResult {
  paymentId: string;
  childName: string;
  amount: number;
  paymentMethod: string;
  newBalance: number;
}

export interface BalanceSetResult {
  familyName: string;
  oldBalance: number;
  newBalance: number;
  setBy?: string;
}
