import { PrismaClient, Child } from '@prisma/client';

export class ChildRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByFamilyAndFirstName(familyId: string, firstName: string): Promise<Child | null> {
    return this.prisma.child.findUnique({
      where: {
        familyId_firstName: {
          familyId,
          firstName,
        },
      },
    });
  }

  async findByFamilyId(familyId: string): Promise<Child[]> {
    return this.prisma.child.findMany({
      where: { familyId },
      orderBy: { firstName: 'asc' },
    });
  }

  async searchByFirstName(familyId: string, firstName: string): Promise<Child[]> {
    return this.prisma.child.findMany({
      where: {
        familyId,
        firstName: {
          contains: firstName,
          mode: 'insensitive',
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async create(data: { familyId: string; firstName: string; gardenName?: string }): Promise<Child> {
    return this.prisma.child.create({ data });
  }

  async upsertByFirstName(
    familyId: string,
    firstName: string,
    data: { gardenName?: string },
  ): Promise<Child> {
    return this.prisma.child.upsert({
      where: {
        familyId_firstName: {
          familyId,
          firstName,
        },
      },
      create: {
        familyId,
        firstName,
        gardenName: data.gardenName,
      },
      update: {
        gardenName: data.gardenName ?? undefined,
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      gardenName?: string;
    },
  ): Promise<Child> {
    return this.prisma.child.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Child> {
    return this.prisma.child.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Child[]> {
    return this.prisma.child.findMany({
      orderBy: { firstName: 'asc' },
    });
  }

  async findById(id: string): Promise<Child | null> {
    return this.prisma.child.findUnique({
      where: { id },
    });
  }
}
