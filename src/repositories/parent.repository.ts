import { PrismaClient, Parent } from '@prisma/client';

export class ParentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTenantAndName(tenantId: string, name: string): Promise<Parent | null> {
    return this.prisma.parent.findUnique({
      where: { tenantId_name: { tenantId, name } },
    });
  }

  async findByTenantId(tenantId: string): Promise<Parent[]> {
    return this.prisma.parent.findMany({ where: { tenantId } });
  }

  async create(data: { tenantId: string; name: string; phone?: string }): Promise<Parent> {
    return this.prisma.parent.create({ data });
  }

  async upsertByName(tenantId: string, name: string, phone?: string): Promise<Parent> {
    return this.prisma.parent.upsert({
      where: { tenantId_name: { tenantId, name } },
      create: { tenantId, name, phone },
      update: { phone: phone ?? undefined },
    });
  }
}
