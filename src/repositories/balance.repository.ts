import { PrismaClient, Balance, Prisma } from '@prisma/client';

export class BalanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByFamilyId(familyId: string): Promise<Balance | null> {
    return this.prisma.balance.findUnique({
      where: { familyId },
    });
  }

  async upsert(
    familyId: string,
    incrementAmount: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Balance> {
    const client = tx ?? this.prisma;
    return client.balance.upsert({
      where: { familyId },
      create: {
        familyId,
        currentBalance: new Prisma.Decimal(incrementAmount),
      },
      update: {
        currentBalance: { increment: incrementAmount },
      },
    });
  }

  async findAllByTenant(tenantId: string): Promise<(Balance & { family: { lastName: string } })[]> {
    return this.prisma.balance.findMany({
      where: {
        family: { tenantId },
      },
      include: {
        family: {
          select: { lastName: true },
        },
      },
      orderBy: {
        family: {
          lastName: 'asc',
        },
      },
    });
  }

  async create(
    familyId: string,
    initialBalance: number = 0,
    tx?: Prisma.TransactionClient,
  ): Promise<Balance> {
    const client = tx ?? this.prisma;
    return client.balance.create({
      data: {
        familyId,
        currentBalance: new Prisma.Decimal(initialBalance),
      },
    });
  }

  async updateBalance(
    familyId: string,
    newBalance: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Balance> {
    const client = tx ?? this.prisma;
    return client.balance.update({
      where: { familyId },
      data: {
        currentBalance: new Prisma.Decimal(newBalance),
      },
    });
  }

  async delete(familyId: string): Promise<Balance> {
    return this.prisma.balance.delete({
      where: { familyId },
    });
  }
}
