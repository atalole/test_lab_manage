/**
 * End-to-End tests for Books API
 * Tests the full request/response flow with validation
 */

import request from 'supertest';
import app from '../../src/server.ts';
import { BookService } from '../../src/services/bookService.ts';

// Mock BookService to isolate API layer tests
jest.mock('../../src/services/bookService.ts');
jest.mock('../../src/config/logger.ts');

describe('E2E - Books API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with health check message', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Server is running',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('GET /api/books', () => {
    it('should return 200 with paginated books', async () => {
      const mockResult = {
        books: [
          {
            id: 1,
            title: 'Test Book',
            author: 'Test Author',
            isbn: '1234567890',
            publishedYear: 2020,
            availabilityStatus: 'Available',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (BookService.getBooks as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/books');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should return 400 for invalid query parameters', async () => {
      const res = await request(app).get('/api/books?limit=999');

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Validation failed',
        })
      );
    });
  });

  describe('POST /api/books', () => {
    it('should create a book and return 201', async () => {
      const newBook = {
        id: 1,
        title: 'New Book',
        author: 'New Author',
        isbn: '9780743273565',
        publishedYear: 2023,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (BookService.createBook as jest.Mock).mockResolvedValue(newBook);

      const res = await request(app)
        .post('/api/books')
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '9780743273565',
          publishedYear: 2023,
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Book created successfully',
        })
      );
    });

    it('should return 400 for invalid ISBN format', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          title: 'Book',
          author: 'Author',
          isbn: 'invalid-isbn',
          publishedYear: 2023,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({
          title: 'Book',
          author: 'Author',
        });

      expect(res.status).toBe(400);
    });

    it('should return 409 when ISBN already exists', async () => {
      const error = { status: 409, message: 'Book with this ISBN already exists' };

      (BookService.createBook as jest.Mock).mockRejectedValue(error);

      const res = await request(app)
        .post('/api/books')
        .send({
          title: 'Duplicate Book',
          author: 'Author',
          isbn: '9780743273565',
          publishedYear: 2023,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a book by ID', async () => {
      const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        isbn: '1234567890',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (BookService.getBookById as jest.Mock).mockResolvedValue(mockBook);

      const res = await request(app).get('/api/books/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 1,
            title: 'Test Book',
            isbn: '1234567890',
          }),
        })
      );
    });

    it('should return 404 when book not found', async () => {
      const error = { status: 404, message: 'Book not found' };

      (BookService.getBookById as jest.Mock).mockRejectedValue(error);

      const res = await request(app).get('/api/books/999');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book successfully', async () => {
      const updatedBook = {
        id: 1,
        title: 'Updated Title',
        author: 'Test Author',
        isbn: '1234567890',
        publishedYear: 2020,
        availabilityStatus: 'Available',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      (BookService.updateBook as jest.Mock).mockResolvedValue(updatedBook);

      const res = await request(app)
        .put('/api/books/1')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Book updated successfully',
        })
      );
    });

    it('should return 404 when book not found', async () => {
      const error = { status: 404, message: 'Book not found' };

      (BookService.updateBook as jest.Mock).mockRejectedValue(error);

      const res = await request(app).put('/api/books/999').send({ title: 'New Title' });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ISBN format in update', async () => {
      const res = await request(app)
        .put('/api/books/1')
        .send({ isbn: 'invalid-isbn' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should soft delete a book successfully', async () => {
      (BookService.deleteBook as jest.Mock).mockResolvedValue({
        message: 'Book deleted successfully',
      });

      const res = await request(app).delete('/api/books/1');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'Book deleted successfully',
        })
      );
    });

    it('should return 404 when book not found', async () => {
      const error = { status: 404, message: 'Book not found' };

      (BookService.deleteBook as jest.Mock).mockRejectedValue(error);

      const res = await request(app).delete('/api/books/999');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books by query', async () => {
      const mockResult = {
        books: [
          {
            id: 1,
            title: 'Test Book',
            author: 'Test Author',
            isbn: '1234567890',
            publishedYear: 2020,
            availabilityStatus: 'Available',
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      (BookService.searchBooks as jest.Mock).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/books/search?q=Test');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });

    it('should return 400 when search query is missing', async () => {
      const res = await request(app).get('/api/books/search');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return empty results when no matches', async () => {
      (BookService.searchBooks as jest.Mock).mockResolvedValue({
        books: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const res = await request(app).get('/api/books/search?q=NonExistent');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('404 handling', () => {
    it('should return 404 for undefined routes', async () => {
      const res = await request(app).get('/api/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: 'Route not found',
        })
      );
    });
  });
});
