import { BookController } from '../../src/controllers/bookController.ts';
import { BookService } from '../../src/services/bookService.ts';
import { AppError } from '../../src/utils/errorHandler.ts';
import { BOOK_MESSAGES } from '../../src/utils/messages.ts';
import { Request, Response, NextFunction } from 'express';

// Mock dependencies
jest.mock('../../src/services/bookService.ts');
jest.mock('../../src/config/logger.ts');

const bookController = new BookController();

describe('BookController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: Partial<NextFunction>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create a book and return 201 status', async () => {
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

      mockReq.body = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
      };

      (BookService.createBook as jest.Mock).mockResolvedValue(mockBook);

      await bookController.createBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.CREATED,
          data: mockBook,
        }),
      );
    });

    it('should handle errors and call next', async () => {
      const error = new AppError('Book already exists', 409);

      mockReq.body = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
      };

      (BookService.createBook as jest.Mock).mockRejectedValue(error);

      await bookController.createBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBooks', () => {
    it('should retrieve books with default pagination', async () => {
      const mockBooks = {
        books: [
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
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockReq.query = {};

      (BookService.getBooks as jest.Mock).mockResolvedValue(mockBooks);

      await bookController.getBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.RETRIEVED_ALL,
          data: mockBooks.books,
          pagination: mockBooks.pagination,
        }),
      );
    });

    it('should parse query parameters correctly', async () => {
      mockReq.query = {
        page: '2',
        limit: '20',
        author: 'Test Author',
        publishedYear: '2020',
      };

      (BookService.getBooks as jest.Mock).mockResolvedValue({
        books: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      });

      await bookController.getBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(BookService.getBooks).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        author: 'Test Author',
        publishedYear: 2020,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      mockReq.query = {};

      (BookService.getBooks as jest.Mock).mockRejectedValue(error);

      await bookController.getBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('getBookById', () => {
    it('should retrieve a book by ID', async () => {
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

      mockReq.params = { id: '1' };

      (BookService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      await bookController.getBookById(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.RETRIEVED,
          data: mockBook,
        }),
      );
    });

    it('should handle not found error', async () => {
      const error = new AppError('Book not found', 404);
      mockReq.params = { id: '999' };

      (BookService.getBookById as jest.Mock).mockRejectedValue(error);

      await bookController.getBookById(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBook', () => {
    it('should update a book successfully', async () => {
      const mockBook = {
        id: 1,
        title: 'Updated Title',
        author: 'Test Author',
        isbn: '123-456-789',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockReq.params = { id: '1' };
      mockReq.body = { title: 'Updated Title' };

      (BookService.updateBook as jest.Mock).mockResolvedValue(mockBook);

      await bookController.updateBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.UPDATED,
          data: mockBook,
        }),
      );
    });

    it('should handle errors', async () => {
      const error = new AppError('Book not found', 404);
      mockReq.params = { id: '999' };
      mockReq.body = { title: 'Updated Title' };

      (BookService.updateBook as jest.Mock).mockRejectedValue(error);

      await bookController.updateBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBook', () => {
    it('should delete a book successfully', async () => {
      mockReq.params = { id: '1' };

      (BookService.deleteBook as jest.Mock).mockResolvedValue({
        message: 'Book deleted successfully',
      });

      await bookController.deleteBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.DELETED,
        }),
      );
    });

    it('should handle not found error', async () => {
      const error = new AppError('Book not found', 404);
      mockReq.params = { id: '999' };

      (BookService.deleteBook as jest.Mock).mockRejectedValue(error);

      await bookController.deleteBook(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('searchBooks', () => {
    it('should search books by query', async () => {
      const mockBooks = {
        books: [
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
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      mockReq.query = { q: 'Test', page: '1', limit: '10' };

      (BookService.searchBooks as jest.Mock).mockResolvedValue(mockBooks);

      await bookController.searchBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: BOOK_MESSAGES.SEARCH_COMPLETED,
          data: mockBooks.books,
          pagination: mockBooks.pagination,
        }),
      );
    });

    it('should pass search parameters correctly', async () => {
      mockReq.query = { q: 'Search Term', page: '2', limit: '20' };

      (BookService.searchBooks as jest.Mock).mockResolvedValue({
        books: [],
        pagination: { page: 2, limit: 20, total: 0, totalPages: 0 },
      });

      await bookController.searchBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(BookService.searchBooks).toHaveBeenCalledWith({
        query: 'Search Term',
        page: 2,
        limit: 20,
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Search error');
      mockReq.query = { q: 'Test' };

      (BookService.searchBooks as jest.Mock).mockRejectedValue(error);

      await bookController.searchBooks(
        mockReq as Request,
        mockRes as Response,
        mockNext as NextFunction,
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
