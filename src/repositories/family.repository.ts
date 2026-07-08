import { PrismaClient, Family, Parent, Child } from '@prisma/client';

export type FamilyWithMembers = Family & {
  parents: Parent[];
  children: Child[];
};

export class FamilyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Family | null> {
    return this.prisma.family.findUnique({
      where: { id },
    });
  }

  async findByIdWithMembers(id: string): Promise<FamilyWithMembers | null> {
    return this.prisma.family.findUnique({
      where: { id },
      include: {
        parents: true,
        children: true,
      },
    });
  }

  async findByTenantAndLastName(tenantId: string, lastName: string): Promise<Family | null> {
    return this.prisma.family.findUnique({
      where: {
        tenantId_lastName: {
          tenantId,
          lastName,
        },
      },
    });
  }

  async findByTenantAndLastNameWithMembers(
    tenantId: string,
    lastName: string,
  ): Promise<FamilyWithMembers | null> {
    return this.prisma.family.findUnique({
      where: {
        tenantId_lastName: {
          tenantId,
          lastName,
        },
      },
      include: {
        parents: true,
        children: true,
      },
    });
  }

  async searchFamiliesByName(tenantId: string, searchName: string): Promise<FamilyWithMembers[]> {
    // Search for families by last name or by parent/child first names
    return this.prisma.family.findMany({
      where: {
        tenantId,
        OR: [
          {
            lastName: {
              contains: searchName,
              mode: 'insensitive',
            },
          },
          {
            parents: {
              some: {
                firstName: {
                  contains: searchName,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            children: {
              some: {
                firstName: {
                  contains: searchName,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      },
      include: {
        parents: true,
        children: true,
      },
    });
  }

  async findByTenantId(tenantId: string): Promise<Family[]> {
    return this.prisma.family.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });
  }

  async findByTenantIdWithMembers(tenantId: string): Promise<FamilyWithMembers[]> {
    return this.prisma.family.findMany({
      where: { tenantId },
      include: {
        parents: true,
        children: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async create(data: { tenantId: string; lastName: string }): Promise<Family> {
    return this.prisma.family.create({
      data,
    });
  }

  async createWithMembers(data: {
    tenantId: string;
    lastName: string;
    parents?: { firstName: string; email?: string; phoneNumber?: string }[];
    children?: { firstName: string; gardenName?: string }[];
  }): Promise<FamilyWithMembers> {
    return this.prisma.family.create({
      data: {
        tenantId: data.tenantId,
        lastName: data.lastName,
        parents: {
          create: data.parents || [],
        },
        children: {
          create: data.children || [],
        },
      },
      include: {
        parents: true,
        children: true,
      },
    });
  }

  async update(id: string, data: { lastName?: string }): Promise<Family> {
    return this.prisma.family.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Family> {
    return this.prisma.family.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Family[]> {
    return this.prisma.family.findMany({
      orderBy: { lastName: 'asc' },
    });
  }
}
