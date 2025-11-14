import { PrismaClient } from '@prisma/client';
import prisma from '../src/config/database.js';

// Clean up database after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Global test timeout
jest.setTimeout(10000);

