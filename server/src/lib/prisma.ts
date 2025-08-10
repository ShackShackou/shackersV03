import { PrismaClient } from '@prisma/client';

let prismaClientSingleton: PrismaClient | null = null;

export const getPrismaClient = (): PrismaClient => {
  if (!prismaClientSingleton) {
    prismaClientSingleton = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  return prismaClientSingleton;
};

const prisma = getPrismaClient();
export default prisma;
