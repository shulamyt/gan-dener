import { Parent } from '@prisma/client';
import { ParentRepository } from '../repositories/parent.repository';

export class ParentService {
  constructor(private readonly parentRepo: ParentRepository) {}

  async findByFamilyAndName(familyId: string, firstName: string): Promise<Parent | null> {
    return this.parentRepo.findByFamilyAndFirstName(familyId, firstName);
  }

  async listByFamily(familyId: string): Promise<Parent[]> {
    return this.parentRepo.findByFamilyId(familyId);
  }

  async searchByName(familyId: string, firstName: string): Promise<Parent[]> {
    return this.parentRepo.searchByFirstName(familyId, firstName);
  }

  async createParent(data: {
    familyId: string;
    firstName: string;
    email?: string;
    phoneNumber?: string;
  }): Promise<Parent> {
    return this.parentRepo.create(data);
  }

  async upsertParent(
    familyId: string,
    firstName: string,
    data: { email?: string; phoneNumber?: string },
  ): Promise<Parent> {
    return this.parentRepo.upsertByFirstName(familyId, firstName, data);
  }

  async updateParent(
    id: string,
    data: {
      firstName?: string;
      email?: string;
      phoneNumber?: string;
    },
  ): Promise<Parent> {
    return this.parentRepo.update(id, data);
  }

  async deleteParent(id: string): Promise<Parent> {
    return this.parentRepo.delete(id);
  }
}
