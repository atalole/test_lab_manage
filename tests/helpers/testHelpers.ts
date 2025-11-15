import prisma from '../../src/config/database';

/**
 * Clean the database (useful for test isolation)
 */
export async function cleanDatabase() {
  await prisma.wishlist.deleteMany({});
  await prisma.book.deleteMany({});
}

/**
 * Create a test book
 */
export async function createTestBook(overrides: any = {}) {
  return await prisma.book.create({
    data: {
      title: 'Test Book',
      author: 'Test Author',
      isbn: `978${Math.floor(Math.random() * 1000000000)}`,
      publishedYear: 2020,
      availabilityStatus: 'Available',
      ...overrides,
    },
  });
}

/**
 * Create a test wishlist entry
 */
export async function createTestWishlist(userId: number, bookId: number) {
  return await prisma.wishlist.create({
    data: {
      userId,
      bookId,
    },
  });
}

/**
 * Generate a unique ISBN for testing
 */
export function generateUniqueISBN() {
  return `978${Math.floor(Math.random() * 1000000000)}`;
}
