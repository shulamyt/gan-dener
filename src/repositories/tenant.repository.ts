import { PrismaClient, Tenant } from '@prisma/client';

export class TenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPhoneNumber(phoneNumber: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { phoneNumber } });
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async create(data: { name: string; phoneNumber: string }): Promise<Tenant> {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; phoneNumber: string }>): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }
}
