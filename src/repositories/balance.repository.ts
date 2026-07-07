import { PrismaClient, Balance, Prisma } from '@prisma/client';

export class BalanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByChildId(childId: string): Promise<Balance | null> {
    return this.prisma.balance.findUnique({ where: { childId } });
  }

  async upsert(
    childId: string,
    incrementAmount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Balance> {
    const client = tx ?? this.prisma;
    return client.balance.upsert({
      where: { childId },
      create: {
        childId,
        currentBalance: new Prisma.Decimal(incrementAmount),
      },
      update: {
        currentBalance: { increment: incrementAmount },
      },
    });
  }

  async findAllByTenant(tenantId: string): Promise<(Balance & { child: { name: string } })[]> {
    return this.prisma.balance.findMany({
      where: { child: { tenantId } },
      include: { child: { select: { name: true } } },
    });
  }
}
