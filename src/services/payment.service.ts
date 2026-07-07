import { PrismaClient, PaymentMethod } from '@prisma/client';
import { PaymentRepository, BalanceRepository } from '../repositories';
import { PaymentMethodLabel, TransactionResult } from '../domain';
import { logger } from '../lib';

const LABEL_TO_ENUM: Record<PaymentMethodLabel, PaymentMethod> = {
  [PaymentMethodLabel.CASH]: PaymentMethod.CASH,
  [PaymentMethodLabel.BIT]: PaymentMethod.BIT,
  [PaymentMethodLabel.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
  [PaymentMethodLabel.CREDIT_CARD]: PaymentMethod.CREDIT_CARD,
  [PaymentMethodLabel.CHECK]: PaymentMethod.CHECK,
  [PaymentMethodLabel.OTHER]: PaymentMethod.OTHER,
};

export class PaymentService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly paymentRepo: PaymentRepository,
    private readonly balanceRepo: BalanceRepository,
  ) {}

  async recordPayment(params: {
    tenantId: string;
    childId: string;
    childName: string;
    amount: number;
    paymentMethod: PaymentMethodLabel;
    notes?: string;
  }): Promise<TransactionResult> {
    const enumMethod = LABEL_TO_ENUM[params.paymentMethod];

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await this.paymentRepo.create(
        {
          tenantId: params.tenantId,
          childId: params.childId,
          amount: params.amount,
          paymentMethod: enumMethod,
          notes: params.notes,
        },
        tx,
      );

      const balance = await this.balanceRepo.upsert(params.childId, params.amount, tx);

      return { payment, balance };
    });

    logger.info('Payment recorded', {
      paymentId: result.payment.id,
      childName: params.childName,
      amount: params.amount,
    });

    return {
      paymentId: result.payment.id,
      childName: params.childName,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      newBalance: Number(result.balance.currentBalance),
    };
  }
}
