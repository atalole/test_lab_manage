import { Book } from '@prisma/client';
import prisma from '../config/database.js';
import { AppError } from '../utils/errorHandler.js';
import { notificationQueue } from '../config/queue.js';
import {
  BookCreateInput,
  BookUpdateInput,
  BookQueryParams,
  SearchQueryParams,
  GetBooksResult,
  SearchBooksResult,
  DeleteBookResult,
  AvailabilityStatus,
} from '../types/index.js';

export class BookService {
  // Create a new book
  static async createBook(data: BookCreateInput): Promise<Book> {
    const { title, author, isbn, publishedYear, availabilityStatus = 'Available' } = data;

    // Check for duplicate ISBN
    const existingBook = await prisma.book.findUnique({
      where: { isbn },
    });

    if (existingBook) {
      throw new AppError('Book with this ISBN already exists', 409);
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
      deletedAt: null;
      author?: { contains: string; mode: 'insensitive' };
      publishedYear?: number;
    } = {
      deletedAt: null, // Only get non-deleted books
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
        deletedAt: null,
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
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
        deletedAt: null,
      },
    });

    if (!existingBook) {
      throw new AppError('Book not found', 404);
    }

    // Check for duplicate ISBN if ISBN is being updated
    if (data.isbn && data.isbn !== existingBook.isbn) {
      const duplicateBook = await prisma.book.findUnique({
        where: { isbn: data.isbn },
      });

      if (duplicateBook) {
        throw new AppError('Book with this ISBN already exists', 409);
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
        }
      );
    }

    return updatedBook;
  }

  // Soft delete a book
  static async deleteBook(id: string | number): Promise<DeleteBookResult> {
    const bookId = typeof id === 'string' ? parseInt(id, 10) : id;

    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        deletedAt: null,
      },
    });

    if (!book) {
      throw new AppError('Book not found', 404);
    }

    // Soft delete
    await prisma.book.update({
      where: { id: bookId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Book deleted successfully' };
  }

  // Search books by title or author
  static async searchBooks(params: SearchQueryParams): Promise<SearchBooksResult> {
    const { query: searchQuery, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;
    const searchTerm = searchQuery.trim();

    const where = {
      deletedAt: null,
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

