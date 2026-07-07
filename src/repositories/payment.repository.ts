import { PrismaClient, Payment, PaymentMethod, Prisma } from '@prisma/client';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      tenantId: string;
      familyId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
      paidFor?: string; // Name of the person who made the payment
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const client = tx ?? this.prisma;
    return client.payment.create({
      data: {
        tenantId: data.tenantId,
        familyId: data.familyId,
        amount: new Prisma.Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        paidFor: data.paidFor,
      },
    });
  }

  async findByTenant(
    tenantId: string,
    options?: { from?: Date; to?: Date; limit?: number; offset?: number },
  ): Promise<Payment[]> {
    const where: Prisma.PaymentWhereInput = { tenantId };

    if (options?.from || options?.to) {
      where.date = {};
      if (options.from) where.date.gte = options.from;
      if (options.to) where.date.lte = options.to;
    }

    return this.prisma.payment.findMany({
      where,
      orderBy: { date: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      include: { 
        family: {
          include: {
            parents: true,
            children: true,
          }
        }
      },
    });
  }

  async findByFamily(familyId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { familyId },
      orderBy: { date: 'desc' },
      include: { 
        family: {
          include: {
            parents: true,
            children: true,
          }
        }
      },
    });
  }

  async findRecentByTenant(
    tenantId: string, 
    limit: number = 10
  ): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: limit,
      include: { 
        family: {
          include: {
            parents: true,
            children: true,
          }
        }
      },
    });
  }

  async getTotalByFamily(familyId: string): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { familyId },
      _sum: { amount: true },
    });
    
    return result._sum.amount?.toNumber() ?? 0;
  }

  async getTotalByTenant(tenantId: string): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: { tenantId },
      _sum: { amount: true },
    });
    
    return result._sum.amount?.toNumber() ?? 0;
  }

  // Legacy method for backward compatibility
  async findByChild(childId: string): Promise<Payment[]> {
    // Find payments through family relationship
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true }
    });
    
    if (!child) return [];
    
    return this.findByFamily(child.familyId);
  }
}
