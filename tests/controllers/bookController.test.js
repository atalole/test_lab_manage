import { BookController } from '../../src/controllers/bookController.js';
import { BookService } from '../../src/services/bookService.js';
import { AppError } from '../../src/utils/errorHandler.js';

// Mock the service
jest.mock('../../src/services/bookService.js');

describe('BookController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create a book and return 201 status', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9781234567890',
        publishedYear: 2020,
        availabilityStatus: 'Available',
      };

      BookService.createBook.mockResolvedValue(mockBook);
      req.body = mockBook;

      await BookController.createBook(req, res, next);

      expect(BookService.createBook).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book created successfully',
        data: mockBook,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error if service throws', async () => {
      const error = new AppError('Duplicate ISBN', 409);
      BookService.createBook.mockRejectedValue(error);
      req.body = { isbn: '9781234567890' };

      await BookController.createBook(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('getBooks', () => {
    it('should return paginated books with default pagination', async () => {
      const mockResult = {
        books: [{ id: 1, title: 'Book 1' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      BookService.getBooks.mockResolvedValue(mockResult);

      await BookController.getBooks(req, res, next);

      expect(BookService.getBooks).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        author: undefined,
        publishedYear: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Books retrieved successfully',
        data: mockResult.books,
        pagination: mockResult.pagination,
      });
    });

    it('should handle query parameters correctly', async () => {
      const mockResult = {
        books: [],
        pagination: { page: 2, limit: 5, total: 10, totalPages: 2 },
      };

      BookService.getBooks.mockResolvedValue(mockResult);
      req.query = { page: '2', limit: '5', author: 'Fitzgerald', publishedYear: '1925' };

      await BookController.getBooks(req, res, next);

      expect(BookService.getBooks).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        author: 'Fitzgerald',
        publishedYear: 1925,
      });
    });
  });

  describe('getBookById', () => {
    it('should return a book by ID', async () => {
      const mockBook = { id: 1, title: 'Test Book' };
      BookService.getBookById.mockResolvedValue(mockBook);
      req.params.id = '1';

      await BookController.getBookById(req, res, next);

      expect(BookService.getBookById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book retrieved successfully',
        data: mockBook,
      });
    });

    it('should call next with error if book not found', async () => {
      const error = new AppError('Book not found', 404);
      BookService.getBookById.mockRejectedValue(error);
      req.params.id = '999';

      await BookController.getBookById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBook', () => {
    it('should update a book and return 200 status', async () => {
      const mockBook = {
        id: 1,
        title: 'Updated Book',
        availabilityStatus: 'Available',
      };

      BookService.updateBook.mockResolvedValue(mockBook);
      req.params.id = '1';
      req.body = { availabilityStatus: 'Available' };

      await BookController.updateBook(req, res, next);

      expect(BookService.updateBook).toHaveBeenCalledWith('1', req.body);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book updated successfully',
        data: mockBook,
      });
    });

    it('should call next with error if update fails', async () => {
      const error = new AppError('Book not found', 404);
      BookService.updateBook.mockRejectedValue(error);
      req.params.id = '999';
      req.body = { title: 'New Title' };

      await BookController.updateBook(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteBook', () => {
    it('should delete a book and return 200 status', async () => {
      const mockResult = { message: 'Book deleted successfully' };
      BookService.deleteBook.mockResolvedValue(mockResult);
      req.params.id = '1';

      await BookController.deleteBook(req, res, next);

      expect(BookService.deleteBook).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Book deleted successfully',
      });
    });

    it('should call next with error if deletion fails', async () => {
      const error = new AppError('Book not found', 404);
      BookService.deleteBook.mockRejectedValue(error);
      req.params.id = '999';

      await BookController.deleteBook(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('searchBooks', () => {
    it('should search books and return results', async () => {
      const mockResult = {
        books: [{ id: 1, title: 'Test Book' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      BookService.searchBooks.mockResolvedValue(mockResult);
      req.query = { q: 'test', page: '1', limit: '10' };

      await BookController.searchBooks(req, res, next);

      expect(BookService.searchBooks).toHaveBeenCalledWith({
        query: 'test',
        page: 1,
        limit: 10,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Search completed successfully',
        data: mockResult.books,
        pagination: mockResult.pagination,
      });
    });

    it('should handle default pagination in search', async () => {
      const mockResult = {
        books: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      };

      BookService.searchBooks.mockResolvedValue(mockResult);
      req.query = { q: 'search term' };

      await BookController.searchBooks(req, res, next);

      expect(BookService.searchBooks).toHaveBeenCalledWith({
        query: 'search term',
        page: 1,
        limit: 10,
      });
    });
  });
});

