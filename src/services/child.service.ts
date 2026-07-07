import { Child } from '@prisma/client';
import { ChildRepository } from '../repositories';

export class ChildService {
  constructor(private readonly childRepo: ChildRepository) {}

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
    data: { gardenName?: string },
  ): Promise<Child> {
    return this.childRepo.upsertByFirstName(familyId, firstName, data);
  }

  async updateChild(
    id: string,
    data: {
      firstName?: string;
      gardenName?: string;
    },
  ): Promise<Child> {
    return this.childRepo.update(id, data);
  }

  async deleteChild(id: string): Promise<Child> {
    return this.childRepo.delete(id);
  }
}
