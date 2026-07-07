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

      const balance = await this.balanceRepo.upsert(params.familyId, params.amount, tx);

      return { payment, balance };
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

  // Legacy method for backward compatibility
  async recordPayment(params: {
    tenantId: string;
    childId: string;
    childName: string;
    amount: number;
    paymentMethod: PaymentMethodLabel;
    notes?: string;
  }): Promise<TransactionResult> {
    // For now, this should work through family relationships
    // Get the child to find their family
    const child = await this.prisma.child.findUnique({
      where: { id: params.childId },
      include: { family: true }
    });

    if (!child) {
      throw new Error(`Child with ID ${params.childId} not found`);
    }

    return this.recordPaymentForFamily({
      tenantId: params.tenantId,
      familyId: child.family.id,
      familyName: child.family.lastName,
      paidFor: child.firstName,
      amount: params.amount,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
    });
  }

  async getFamilyBalance(familyId: string): Promise<number> {
    const balance = await this.balanceRepo.findByFamilyId(familyId);
    return balance ? Number(balance.currentBalance) : 0;
  }

  async getFamilyPaymentHistory(familyId: string): Promise<any[]> {
    return this.paymentRepo.findByFamily(familyId);
  }

  async getTenantPaymentHistory(tenantId: string, limit?: number): Promise<any[]> {
    return this.paymentRepo.findRecentByTenant(tenantId, limit);
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
          tx
        );
      } else {
        // Create new balance
        updatedBalance = await this.balanceRepo.create(params.familyId, params.newBalance, tx);
      }

      return { oldBalance, newBalance: Number(updatedBalance.currentBalance) };
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
