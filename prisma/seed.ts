import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create sample books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '9780743273565',
        publishedYear: 1925,
        availabilityStatus: 'Available',
      },
    }),
    prisma.book.create({
      data: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '9780061120084',
        publishedYear: 1960,
        availabilityStatus: 'Borrowed',
      },
    }),
    prisma.book.create({
      data: {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780451524935',
        publishedYear: 1949,
        availabilityStatus: 'Available',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '9780141439518',
        publishedYear: 1813,
        availabilityStatus: 'Borrowed',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '9780316769174',
        publishedYear: 1951,
        availabilityStatus: 'Available',
      },
    }),
  ]);

  // Create sample wishlists
  await Promise.all([
    prisma.wishlist.create({
      data: {
        userId: 1,
        bookId: books[1].id, // To Kill a Mockingbird (Borrowed)
      },
    }),
    prisma.wishlist.create({
      data: {
        userId: 2,
        bookId: books[1].id, // To Kill a Mockingbird (Borrowed)
      },
    }),
    prisma.wishlist.create({
      data: {
        userId: 1,
        bookId: books[3].id, // Pride and Prejudice (Borrowed)
      },
    }),
  ]);

  console.log('Database seeded successfully!');
  console.log(`Created ${books.length} books and 3 wishlist entries`);
}

main()
  .catch((e: Error) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

