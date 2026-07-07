import { Child } from '@prisma/client';
import { ChildRepository } from '../repositories';
import { ChildNotFoundError } from '../domain';

export class ChildService {
  constructor(
    private readonly childRepo: ChildRepository,
  ) {}

  async findByName(tenantId: string, name: string): Promise<Child> {
    const existing = await this.childRepo.findByTenantAndName(tenantId, name);
    if (existing) return existing;

    const candidates = await this.childRepo.searchByName(tenantId, name.split(' ')[0]);
    if (candidates.length === 1) {
      return candidates[0];
    }

    const suggestions = candidates.length > 1
      ? candidates.map((c) => c.name)
      : await this.findSuggestions(tenantId);

    throw new ChildNotFoundError(name, suggestions);
  }

  private async findSuggestions(tenantId: string): Promise<string[]> {
    const all = await this.childRepo.findByTenantId(tenantId);
    return all.map((c) => c.name);
  }

  async listByTenant(tenantId: string): Promise<Child[]> {
    return this.childRepo.findByTenantId(tenantId);
  }
}
