import { PrismaClient, PaymentMethod, BalanceChangeType, Payment } from '@prisma/client';
import { PaymentRepository, BalanceRepository, BalanceHistoryRepository } from '../repositories';
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
    private readonly balanceHistoryRepo: BalanceHistoryRepository,
  ) {}

  async recordPaymentForFamily(params: {
    tenantId: string;
    familyId: string;
    familyName: string;
    paidFor: string; // Name of person who made the payment (parent or child)
    amount: number;
    paymentMethod: PaymentMethodLabel;
    notes?: string;
  }): Promise<TransactionResult> {
    const enumMethod = LABEL_TO_ENUM[params.paymentMethod];

    const result = await this.prisma.$transaction(async (tx) => {
      // Get current balance before the change
      const currentBalance = await this.balanceRepo.findByFamilyId(params.familyId);
      const oldBalance = currentBalance ? Number(currentBalance.currentBalance) : 0;

      // Create payment record
      const payment = await this.paymentRepo.create(
        {
          tenantId: params.tenantId,
          familyId: params.familyId,
          amount: params.amount,
          paymentMethod: enumMethod,
          notes: params.notes,
          paidFor: params.paidFor,
        },
        tx,
      );

      // Update balance
      const balance = await this.balanceRepo.upsert(params.familyId, params.amount, tx);
      const newBalance = Number(balance.currentBalance);

      // Log balance history
      await this.balanceHistoryRepo.create(
        {
          familyId: params.familyId,
          previousBalance: oldBalance,
          newBalance: newBalance,
          changeType: BalanceChangeType.PAYMENT_RECEIVED,
          changedBy: params.paidFor,
          relatedPaymentId: payment.id,
          notes: params.notes,
        },
        tx,
      );

      return { payment, balance, oldBalance, newBalance };
    });

    logger.info('Payment recorded for family', {
      paymentId: result.payment.id,
      familyName: params.familyName,
      paidFor: params.paidFor,
      amount: params.amount,
    });

    return {
      paymentId: result.payment.id,
      childName: `${params.familyName} (${params.paidFor})`, // Show family name + who paid
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      newBalance: Number(result.balance.currentBalance),
    };
  }

  async getFamilyBalance(familyId: string): Promise<number> {
    const balance = await this.balanceRepo.findByFamilyId(familyId);
    return balance ? Number(balance.currentBalance) : 0;
  }

  async getFamilyPaymentHistory(familyId: string): Promise<Payment[]> {
    return this.paymentRepo.findByFamily(familyId);
  }

  async getTenantPaymentHistory(tenantId: string, limit?: number): Promise<Payment[]> {
    return this.paymentRepo.findRecentByTenant(tenantId, limit);
  }

  async getFamilyBalanceHistory(
    familyId: string,
    options?: { limit?: number; offset?: number; from?: Date; to?: Date },
  ) {
    return this.balanceHistoryRepo.findByFamily(familyId, options);
  }

  async getTenantBalanceHistory(
    tenantId: string,
    options?: { limit?: number; offset?: number; from?: Date; to?: Date },
  ) {
    return this.balanceHistoryRepo.findByTenant(tenantId, options);
  }

  async getFamilyBalanceStats(familyId: string, from?: Date, to?: Date) {
    return this.balanceHistoryRepo.getStatsByFamily(familyId, from, to);
  }

  async getTenantBalanceStats(tenantId: string, from?: Date, to?: Date) {
    return this.balanceHistoryRepo.getStatsByTenant(tenantId, from, to);
  }

  async setFamilyBalance(params: {
    familyId: string;
    familyName: string;
    newBalance: number;
    setBy?: string; // Name of person who set the balance
    notes?: string;
  }): Promise<{
    familyName: string;
    oldBalance: number;
    newBalance: number;
    setBy?: string;
  }> {
    const result = await this.prisma.$transaction(async (tx) => {
      // Get current balance
      const currentBalance = await this.balanceRepo.findByFamilyId(params.familyId);
      const oldBalance = currentBalance ? Number(currentBalance.currentBalance) : 0;

      // Update or create balance
      let updatedBalance;
      if (currentBalance) {
        // Update existing balance
        updatedBalance = await this.balanceRepo.updateBalance(
          params.familyId,
          params.newBalance,
          tx,
        );
      } else {
        // Create new balance
        updatedBalance = await this.balanceRepo.create(params.familyId, params.newBalance, tx);
      }

      const newBalance = Number(updatedBalance.currentBalance);

      // Log balance history
      await this.balanceHistoryRepo.create(
        {
          familyId: params.familyId,
          previousBalance: oldBalance,
          newBalance: newBalance,
          changeType: BalanceChangeType.BALANCE_SET,
          changedBy: params.setBy,
          notes: params.notes,
        },
        tx,
      );

      return { oldBalance, newBalance };
    });

    logger.info('Balance set for family', {
      familyName: params.familyName,
      oldBalance: result.oldBalance,
      newBalance: result.newBalance,
      setBy: params.setBy,
    });

    return {
      familyName: params.familyName,
      oldBalance: result.oldBalance,
      newBalance: result.newBalance,
      setBy: params.setBy,
    };
  }
}
