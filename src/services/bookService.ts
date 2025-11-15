import { Book } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../utils/errorHandler.ts';
import { BOOK_ERRORS } from '../utils/errors.ts';
import { notificationQueue } from '../config/queue.ts';
import {
  BookCreateInput,
  BookUpdateInput,
  BookQueryParams,
  SearchQueryParams,
  GetBooksResult,
  SearchBooksResult,
  AvailabilityStatus,
} from '../types/index.ts';

export class BookService {
  // Create a new book
  static async createBook(data: BookCreateInput): Promise<Book> {
    const { title, author, isbn, publishedYear, availabilityStatus = 'Available' } = data;

    // Check for duplicate ISBN (only for non-deleted books)
    const existingBook = await prisma.book.findFirst({
      where: {
        isbn,
        isDeleted: false,
      },
    });

    if (existingBook) {
      throw new AppError(BOOK_ERRORS.DUPLICATE_ISBN.message, BOOK_ERRORS.DUPLICATE_ISBN.statusCode);
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        publishedYear,
        availabilityStatus: availabilityStatus as AvailabilityStatus,
      },
    });

    return book;
  }

  // Get paginated list of books with optional filters
  static async getBooks(params: BookQueryParams): Promise<GetBooksResult> {
    const { page = 1, limit = 10, author, publishedYear } = params;
    const skip = (page - 1) * limit;

    const where: {
      isDeleted: boolean;
      author?: { contains: string; mode: 'insensitive' };
      publishedYear?: number;
    } = {
      isDeleted: false, // Only get non-deleted books
    };

    if (author) {
      where.author = {
        contains: author,
        mode: 'insensitive',
      };
    }

    if (publishedYear) {
      where.publishedYear = publishedYear;
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get a single book by ID
  static async getBookById(id: string | number): Promise<Book> {
    const book = await prisma.book.findFirst({
      where: {
        id: typeof id === 'string' ? parseInt(id, 10) : id,
        isDeleted: false,
      },
    });

    if (!book) {
      throw new AppError(BOOK_ERRORS.NOT_FOUND.message, BOOK_ERRORS.NOT_FOUND.statusCode);
    }

    return book;
  }

  // Update book details
  static async updateBook(id: string | number, data: BookUpdateInput): Promise<Book> {
    const bookId = typeof id === 'string' ? parseInt(id, 10) : id;

    // Check if book exists and is not deleted
    const existingBook = await prisma.book.findFirst({
      where: {
        id: bookId,
        isDeleted: false,
      },
    });

    if (!existingBook) {
      throw new AppError(BOOK_ERRORS.NOT_FOUND.message, BOOK_ERRORS.NOT_FOUND.statusCode);
    }

    // Check for duplicate ISBN if ISBN is being updated (only for non-deleted books)
    if (data.isbn && data.isbn !== existingBook.isbn) {
      const duplicateBook = await prisma.book.findFirst({
        where: {
          isbn: data.isbn,
          isDeleted: false,
        },
      });

      if (duplicateBook) {
        throw new AppError(
          BOOK_ERRORS.DUPLICATE_ISBN.message,
          BOOK_ERRORS.DUPLICATE_ISBN.statusCode,
        );
      }
    }

    // Track previous status for notification
    const previousStatus = existingBook.availabilityStatus;
    const newStatus = data.availabilityStatus;

    // Update the book
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...data,
        availabilityStatus: data.availabilityStatus as AvailabilityStatus | undefined,
      },
    });

    // Trigger async notification if status changed from Borrowed to Available
    if (previousStatus === 'Borrowed' && newStatus === 'Available') {
      await notificationQueue.add(
        'wishlist-notification',
        {
          bookId: updatedBook.id,
          bookTitle: updatedBook.title,
        },
        {
          priority: 1,
        },
      );
    }

    return updatedBook;
  }

  // Soft delete a book
  static async deleteBook(id: string | number): Promise<void> {
    const bookId = typeof id === 'string' ? parseInt(id, 10) : id;

    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        isDeleted: false,
      },
    });

    if (!book) {
      throw new AppError(BOOK_ERRORS.NOT_FOUND.message, BOOK_ERRORS.NOT_FOUND.statusCode);
    }

    // Soft delete
    await prisma.book.update({
      where: { id: bookId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // Search books by title or author
  static async searchBooks(params: SearchQueryParams): Promise<SearchBooksResult> {
    const { query: searchQuery, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const searchTerm = searchQuery.trim();

    const where = {
      isDeleted: false,
      OR: [
        {
          title: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
        {
          author: {
            contains: searchTerm,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
