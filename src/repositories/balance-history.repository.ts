import { PrismaClient, BalanceHistory, BalanceChangeType, Prisma } from '@prisma/client';

export type BalanceHistoryWithFamily = BalanceHistory & {
  family: {
    lastName: string;
    tenantId: string;
  };
};

export class BalanceHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      familyId: string;
      previousBalance: number;
      newBalance: number;
      changeType: BalanceChangeType;
      changedBy?: string;
      relatedPaymentId?: string;
      notes?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<BalanceHistory> {
    const client = tx ?? this.prisma;
    const changeAmount = data.newBalance - data.previousBalance;

    return client.balanceHistory.create({
      data: {
        familyId: data.familyId,
        previousBalance: new Prisma.Decimal(data.previousBalance),
        newBalance: new Prisma.Decimal(data.newBalance),
        changeAmount: new Prisma.Decimal(changeAmount),
        changeType: data.changeType,
        changedBy: data.changedBy,
        relatedPaymentId: data.relatedPaymentId,
        notes: data.notes,
      },
    });
  }

  async findByFamily(
    familyId: string,
    options?: {
      limit?: number;
      offset?: number;
      from?: Date;
      to?: Date;
    },
  ): Promise<BalanceHistory[]> {
    const where: Prisma.BalanceHistoryWhereInput = { familyId };

    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }

    return this.prisma.balanceHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async findByTenant(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      from?: Date;
      to?: Date;
    },
  ): Promise<BalanceHistoryWithFamily[]> {
    const where: Prisma.BalanceHistoryWhereInput = {
      family: { tenantId },
    };

    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options.from) where.createdAt.gte = options.from;
      if (options.to) where.createdAt.lte = options.to;
    }

    return this.prisma.balanceHistory.findMany({
      where,
      include: {
        family: {
          select: {
            lastName: true,
            tenantId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 100,
      skip: options?.offset ?? 0,
    });
  }

  async findRecent(limit: number = 20): Promise<BalanceHistoryWithFamily[]> {
    return this.prisma.balanceHistory.findMany({
      include: {
        family: {
          select: {
            lastName: true,
            tenantId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStatsByFamily(
    familyId: string,
    from?: Date,
    to?: Date,
  ): Promise<{
    totalChanges: number;
    totalPayments: number;
    totalBalanceSets: number;
    totalAmountReceived: number;
  }> {
    const where: Prisma.BalanceHistoryWhereInput = { familyId };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [totalChanges, paymentChanges, balanceSetChanges] = await Promise.all([
      // Total number of changes
      this.prisma.balanceHistory.count({ where }),

      // Payment-related changes
      this.prisma.balanceHistory.aggregate({
        where: {
          ...where,
          changeType: BalanceChangeType.PAYMENT_RECEIVED,
        },
        _count: { id: true },
        _sum: { changeAmount: true },
      }),

      // Balance set changes
      this.prisma.balanceHistory.count({
        where: {
          ...where,
          changeType: BalanceChangeType.BALANCE_SET,
        },
      }),
    ]);

    return {
      totalChanges,
      totalPayments: paymentChanges._count.id,
      totalBalanceSets: balanceSetChanges,
      totalAmountReceived: paymentChanges._sum.changeAmount?.toNumber() ?? 0,
    };
  }

  async getStatsByTenant(
    tenantId: string,
    from?: Date,
    to?: Date,
  ): Promise<{
    totalChanges: number;
    totalPayments: number;
    totalBalanceSets: number;
    totalAmountReceived: number;
    familiesAffected: number;
  }> {
    const where: Prisma.BalanceHistoryWhereInput = {
      family: { tenantId },
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [totalChanges, paymentChanges, balanceSetChanges, familiesAffected] = await Promise.all([
      // Total number of changes
      this.prisma.balanceHistory.count({ where }),

      // Payment-related changes
      this.prisma.balanceHistory.aggregate({
        where: {
          ...where,
          changeType: BalanceChangeType.PAYMENT_RECEIVED,
        },
        _count: { id: true },
        _sum: { changeAmount: true },
      }),

      // Balance set changes
      this.prisma.balanceHistory.count({
        where: {
          ...where,
          changeType: BalanceChangeType.BALANCE_SET,
        },
      }),

      // Unique families affected
      this.prisma.balanceHistory
        .groupBy({
          by: ['familyId'],
          where,
        })
        .then((groups) => groups.length),
    ]);

    return {
      totalChanges,
      totalPayments: paymentChanges._count.id,
      totalBalanceSets: balanceSetChanges,
      totalAmountReceived: paymentChanges._sum.changeAmount?.toNumber() ?? 0,
      familiesAffected,
    };
  }

  async deleteByFamily(familyId: string): Promise<number> {
    const result = await this.prisma.balanceHistory.deleteMany({
      where: { familyId },
    });
    return result.count;
  }
}
