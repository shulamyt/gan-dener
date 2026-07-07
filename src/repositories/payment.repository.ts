import { PrismaClient, Payment, PaymentMethod, Prisma } from '@prisma/client';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: {
      tenantId: string;
      childId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      notes?: string;
    },
    tx?: Prisma.TransactionClient,
  ): Promise<Payment> {
    const client = tx ?? this.prisma;
    return client.payment.create({
      data: {
        tenantId: data.tenantId,
        childId: data.childId,
        amount: new Prisma.Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
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
      include: { child: true },
    });
  }

  async findByChild(childId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { childId },
      orderBy: { date: 'desc' },
    });
  }
}
