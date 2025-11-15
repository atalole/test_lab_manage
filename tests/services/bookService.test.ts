/**
 * Unit tests for BookService
 */

// Mock dependencies before importing
jest.mock('../../src/config/logger.ts');
jest.mock('../../src/config/queue.ts');

// Mock prisma
const mockPrismaBook = {
  findUnique: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../src/config/database.ts', () => ({
  __esModule: true,
  default: {
    book: mockPrismaBook,
  },
}));

import { BookService } from '../../src/services/bookService.ts';
import { AppError } from '../../src/utils/errorHandler.ts';
import { notificationQueue } from '../../src/config/queue.ts';

describe('BookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create a book successfully when ISBN is unique', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaBook.findUnique.mockResolvedValue(null);
      mockPrismaBook.create.mockResolvedValue(mockBook);

      const result = await BookService.createBook({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
      });

      expect(mockPrismaBook.findUnique).toHaveBeenCalledWith({
        where: { isbn: '123-456-789' },
      });
      expect(mockPrismaBook.create).toHaveBeenCalled();
      expect(result).toEqual(mockBook);
    });

    it('should throw error when ISBN already exists', async () => {
      mockPrismaBook.findUnique.mockResolvedValue({ id: 1 });

      await expect(
        BookService.createBook({
          title: 'Test Book',
          author: 'Test Author',
          isbn: '123-456-789',
          publishedYear: 2020,
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe('getBooks', () => {
    it('should retrieve paginated books successfully', async () => {
      const mockBooks = [
        {
          id: 1,
          title: 'Book 1',
          author: 'Author 1',
          isbn: '111',
          publishedYear: 2020,
          availabilityStatus: 'Available',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaBook.findMany.mockResolvedValue(mockBooks);
      mockPrismaBook.count.mockResolvedValue(1);

      const result = await BookService.getBooks({ page: 1, limit: 10 });

      expect(result.books).toEqual(mockBooks);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getBookById', () => {
    it('should retrieve a book by ID successfully', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaBook.findFirst.mockResolvedValue(mockBook);

      const result = await BookService.getBookById(1);

      expect(result).toEqual(mockBook);
    });

    it('should throw error when book not found', async () => {
      mockPrismaBook.findFirst.mockResolvedValue(null);

      await expect(BookService.getBookById(999)).rejects.toThrow(AppError);
    });
  });

  describe('updateBook', () => {
    it('should update a book successfully', async () => {
      const existingBook = {
        id: 1,
        title: 'Old Title',
        author: 'Old Author',
        isbn: '111',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedBook = { ...existingBook, title: 'New Title' };

      mockPrismaBook.findFirst.mockResolvedValue(existingBook);
      mockPrismaBook.update.mockResolvedValue(updatedBook);

      const result = await BookService.updateBook(1, { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should throw error when book not found', async () => {
      mockPrismaBook.findFirst.mockResolvedValue(null);

      await expect(BookService.updateBook(999, { title: 'New Title' })).rejects.toThrow(AppError);
    });

    it('should trigger notification when status changes from Borrowed to Available', async () => {
      const existingBook = {
        id: 1,
        availabilityStatus: 'Borrowed',
        isbn: '111',
        title: 'Test Book',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedBook = { ...existingBook, availabilityStatus: 'Available' };

      mockPrismaBook.findFirst.mockResolvedValue(existingBook);
      mockPrismaBook.update.mockResolvedValue(updatedBook);

      await BookService.updateBook(1, { availabilityStatus: 'Available' as any });

      expect(notificationQueue.add).toHaveBeenCalled();
      await notificationQueue.close();
    });
  });

  describe('deleteBook', () => {
    it('should soft delete a book successfully', async () => {
      const existingBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaBook.findFirst.mockResolvedValue(existingBook);
      mockPrismaBook.update.mockResolvedValue({
        ...existingBook,
        deletedAt: new Date(),
      });

      await BookService.deleteBook(1);

      expect(mockPrismaBook.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw error when book not found', async () => {
      mockPrismaBook.findFirst.mockResolvedValue(null);

      await expect(BookService.deleteBook(999)).rejects.toThrow(AppError);
    });
  });

  describe('searchBooks', () => {
    it('should search books by query', async () => {
      const mockBooks = [
        {
          id: 1,
          title: 'Test Book',
          author: 'Test Author',
          isbn: '123-456-789',
          publishedYear: 2020,
          availabilityStatus: 'Available',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaBook.findMany.mockResolvedValue(mockBooks);
      mockPrismaBook.count.mockResolvedValue(1);

      const result = await BookService.searchBooks({ query: 'Test', page: 1, limit: 10 });

      expect(result.books).toEqual(mockBooks);
      expect(result.pagination.total).toBe(1);
    });

    it('should return empty results when no matches', async () => {
      mockPrismaBook.findMany.mockResolvedValue([]);
      mockPrismaBook.count.mockResolvedValue(0);

      const result = await BookService.searchBooks({ query: 'NonExistent', page: 1, limit: 10 });

      expect(result.books).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });
});
