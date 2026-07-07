import { Child } from '@prisma/client';
import { ChildRepository } from '../repositories';
import { ChildNotFoundError } from '../domain';

export class ChildService {
  constructor(
    private readonly childRepo: ChildRepository,
  ) {}

  async findByFamilyAndName(familyId: string, firstName: string): Promise<Child | null> {
    return this.childRepo.findByFamilyAndFirstName(familyId, firstName);
  }

  async listByFamily(familyId: string): Promise<Child[]> {
    return this.childRepo.findByFamilyId(familyId);
  }

  async searchByName(familyId: string, firstName: string): Promise<Child[]> {
    return this.childRepo.searchByFirstName(familyId, firstName);
  }

  async createChild(data: {
    familyId: string;
    firstName: string;
    gardenName?: string;
  }): Promise<Child> {
    return this.childRepo.create(data);
  }

  async upsertChild(
    familyId: string,
    firstName: string,
    data: { gardenName?: string }
  ): Promise<Child> {
    return this.childRepo.upsertByFirstName(familyId, firstName, data);
  }

  async updateChild(id: string, data: {
    firstName?: string;
    gardenName?: string;
  }): Promise<Child> {
    return this.childRepo.update(id, data);
  }

  async deleteChild(id: string): Promise<Child> {
    return this.childRepo.delete(id);
  }

  // Legacy methods for backward compatibility during migration
  async findByName(tenantId: string, name: string): Promise<Child> {
    // First try to find by exact match across all families
    const allChildren = await this.childRepo.findByTenantId(tenantId);
    const exactMatch = allChildren.find(c => 
      c.firstName.toLowerCase() === name.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Then try partial matches
    const candidates = await this.childRepo.searchByName(tenantId, name.split(' ')[0]);
    if (candidates.length === 1) {
      return candidates[0];
    }

    const suggestions = candidates.length > 1
      ? candidates.map((c) => c.firstName)
      : await this.findSuggestions(tenantId);

    throw new ChildNotFoundError(name, suggestions);
  }

  private async findSuggestions(tenantId: string): Promise<string[]> {
    const all = await this.childRepo.findByTenantId(tenantId);
    return all.map((c) => c.firstName);
  }

  async listByTenant(tenantId: string): Promise<Child[]> {
    return this.childRepo.findByTenantId(tenantId);
  }
}
