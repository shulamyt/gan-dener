import { Tenant } from '@prisma/client';
import { TenantRepository } from '../repositories';
import { TenantNotFoundError } from '../domain';

export class TenantService {
  constructor(private readonly tenantRepo: TenantRepository) {}

  async getByPhoneNumber(phoneNumber: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findByPhoneNumber(phoneNumber);
    if (!tenant) {
      throw new TenantNotFoundError(phoneNumber);
    }
    return tenant;
  }

  async getOrCreate(phoneNumber: string, name?: string): Promise<Tenant> {
    const existing = await this.tenantRepo.findByPhoneNumber(phoneNumber);
    if (existing) return existing;

    return this.tenantRepo.create({
      name: name ?? `Tenant ${phoneNumber}`,
      phoneNumber,
    });
  }
}
