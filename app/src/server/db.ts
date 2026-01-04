import { PrismaClient, Currency } from '../../../prisma/generated/client';

// Create a singleton instance of PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  });

if (typeof globalForPrisma !== 'undefined') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient, Currency };
export * from '../../../prisma/generated/client';
