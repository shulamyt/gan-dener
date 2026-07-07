import { PrismaClient, Child } from '@prisma/client';

export class ChildRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTenantAndName(tenantId: string, name: string): Promise<Child | null> {
    return this.prisma.child.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
  }

  async findByTenantId(tenantId: string): Promise<Child[]> {
    return this.prisma.child.findMany({
      where: { tenantId },
      include: { parent: true, balance: true },
    });
  }

  async create(data: { tenantId: string; parentId: string; name: string }): Promise<Child> {
    return this.prisma.child.create({ data });
  }

  async searchByName(tenantId: string, nameFragment: string): Promise<Child[]> {
    return this.prisma.child.findMany({
      where: {
        tenantId,
        name: { contains: nameFragment, mode: 'insensitive' },
      },
      include: { parent: true },
    });
  }
}
