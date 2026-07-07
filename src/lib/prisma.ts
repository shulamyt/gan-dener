import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from './logger';
import { env } from '../config';

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
    logger.info('Prisma client initialized');
  }

  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
