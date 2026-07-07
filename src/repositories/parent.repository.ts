import { PrismaClient, Parent } from '@prisma/client';

export class ParentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByFamilyAndFirstName(familyId: string, firstName: string): Promise<Parent | null> {
    return this.prisma.parent.findUnique({
      where: { 
        familyId_firstName: { 
          familyId, 
          firstName 
        } 
      },
    });
  }

  async findByFamilyId(familyId: string): Promise<Parent[]> {
    return this.prisma.parent.findMany({ 
      where: { familyId },
      orderBy: { firstName: 'asc' }
    });
  }

  async searchByFirstName(familyId: string, firstName: string): Promise<Parent[]> {
    return this.prisma.parent.findMany({
      where: {
        familyId,
        firstName: {
          contains: firstName,
          mode: 'insensitive',
        },
      },
      orderBy: { firstName: 'asc' }
    });
  }

  async create(data: { 
    familyId: string; 
    firstName: string; 
    email?: string; 
    phoneNumber?: string; 
  }): Promise<Parent> {
    return this.prisma.parent.create({ data });
  }

  async upsertByFirstName(
    familyId: string, 
    firstName: string, 
    data: { email?: string; phoneNumber?: string }
  ): Promise<Parent> {
    return this.prisma.parent.upsert({
      where: { 
        familyId_firstName: { 
          familyId, 
          firstName 
        } 
      },
      create: { 
        familyId, 
        firstName, 
        email: data.email, 
        phoneNumber: data.phoneNumber 
      },
      update: { 
        email: data.email ?? undefined, 
        phoneNumber: data.phoneNumber ?? undefined 
      },
    });
  }

  async update(id: string, data: {
    firstName?: string;
    email?: string;
    phoneNumber?: string;
  }): Promise<Parent> {
    return this.prisma.parent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Parent> {
    return this.prisma.parent.delete({
      where: { id },
    });
  }
}
