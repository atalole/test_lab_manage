import request from 'supertest';
import createTestApp from '../helpers/testApp.js';
import { cleanDatabase, createTestBook, createTestWishlist, generateUniqueISBN } from '../helpers/testHelpers.js';
import { notificationQueue } from '../../src/config/queue.js';

// Mock the notification queue for E2E tests
jest.mock('../../src/config/queue.js', () => ({
  notificationQueue: {
    add: jest.fn(),
    close: jest.fn(),
  },
}));

const app = createTestApp();

describe('Books API E2E Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe('POST /api/books', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: generateUniqueISBN(),
        publishedYear: 1925,
        availabilityStatus: 'Available',
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(bookData.title);
      expect(response.body.data.author).toBe(bookData.author);
      expect(response.body.data.isbn).toBe(bookData.isbn);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        title: '', // Empty title
        author: 'Author',
        isbn: '123', // Invalid ISBN
        publishedYear: 1800, // Invalid year
      };

      const response = await request(app)
        .post('/api/books')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 409 for duplicate ISBN', async () => {
      const isbn = generateUniqueISBN();
      const book1 = {
        title: 'Book 1',
        author: 'Author 1',
        isbn,
        publishedYear: 2020,
      };

      await request(app).post('/api/books').send(book1).expect(201);

      const book2 = {
        title: 'Book 2',
        author: 'Author 2',
        isbn, // Same ISBN
        publishedYear: 2021,
      };

      const response = await request(app)
        .post('/api/books')
        .send(book2)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ISBN');
    });

    it('should default to Available status if not provided', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: generateUniqueISBN(),
        publishedYear: 2020,
      };

      const response = await request(app)
        .post('/api/books')
        .send(bookData)
        .expect(201);

      expect(response.body.data.availabilityStatus).toBe('Available');
    });
  });

  describe('GET /api/books', () => {
    it('should return paginated list of books', async () => {
      // Create test books
      await createTestBook({ title: 'Book 1' });
      await createTestBook({ title: 'Book 2' });
      await createTestBook({ title: 'Book 3' });

      const response = await request(app)
        .get('/api/books?page=1&limit=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('total', 3);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('totalPages', 2);
    });

    it('should filter books by author', async () => {
      await createTestBook({ title: 'Book 1', author: 'John Doe' });
      await createTestBook({ title: 'Book 2', author: 'Jane Smith' });
      await createTestBook({ title: 'Book 3', author: 'John Smith' });

      const response = await request(app)
        .get('/api/books?author=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(book => book.author.includes('John'))).toBe(true);
    });

    it('should filter books by publishedYear', async () => {
      await createTestBook({ title: 'Book 1', publishedYear: 2020 });
      await createTestBook({ title: 'Book 2', publishedYear: 2021 });
      await createTestBook({ title: 'Book 3', publishedYear: 2020 });

      const response = await request(app)
        .get('/api/books?publishedYear=2020')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(book => book.publishedYear === 2020)).toBe(true);
    });

    it('should not return soft-deleted books', async () => {
      const book = await createTestBook({ title: 'Active Book' });
      await createTestBook({ title: 'Deleted Book', deletedAt: new Date() });

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Active Book');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return a book by ID', async () => {
      const book = await createTestBook({ title: 'Test Book' });

      const response = await request(app)
        .get(`/api/books/${book.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(book.id);
      expect(response.body.data.title).toBe('Test Book');
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .get('/api/books/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for soft-deleted book', async () => {
      const book = await createTestBook();
      await request(app).delete(`/api/books/${book.id}`).expect(200);

      const response = await request(app)
        .get(`/api/books/${book.id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book successfully', async () => {
      const book = await createTestBook({ title: 'Original Title' });

      const response = await request(app)
        .put(`/api/books/${book.id}`)
        .send({
          title: 'Updated Title',
          author: 'Updated Author',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.author).toBe('Updated Author');
    });

    it('should trigger notification when status changes from Borrowed to Available', async () => {
      const book = await createTestBook({
        title: 'Borrowed Book',
        availabilityStatus: 'Borrowed',
      });

      // Create wishlist entries
      await createTestWishlist(1, book.id);
      await createTestWishlist(2, book.id);

      const response = await request(app)
        .put(`/api/books/${book.id}`)
        .send({
          availabilityStatus: 'Available',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.availabilityStatus).toBe('Available');
      
      // Verify notification queue was called
      expect(notificationQueue.add).toHaveBeenCalledTimes(1);
      expect(notificationQueue.add).toHaveBeenCalledWith(
        'wishlist-notification',
        {
          bookId: book.id,
          bookTitle: 'Borrowed Book',
        },
        {
          priority: 1,
        }
      );
    });

    it('should not trigger notification for other status changes', async () => {
      const book = await createTestBook({
        title: 'Available Book',
        availabilityStatus: 'Available',
      });

      await request(app)
        .put(`/api/books/${book.id}`)
        .send({
          availabilityStatus: 'Borrowed',
        })
        .expect(200);

      expect(notificationQueue.add).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .put('/api/books/99999')
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid update data', async () => {
      const book = await createTestBook();

      const response = await request(app)
        .put(`/api/books/${book.id}`)
        .send({
          publishedYear: 'invalid',
          availabilityStatus: 'InvalidStatus',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should soft delete a book successfully', async () => {
      const book = await createTestBook({ title: 'Book to Delete' });

      const response = await request(app)
        .delete(`/api/books/${book.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Book deleted successfully');

      // Verify book is soft-deleted (not returned in GET)
      await request(app)
        .get(`/api/books/${book.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await request(app)
        .delete('/api/books/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for already deleted book', async () => {
      const book = await createTestBook();
      await request(app).delete(`/api/books/${book.id}`).expect(200);

      const response = await request(app)
        .delete(`/api/books/${book.id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/books/search', () => {
    it('should search books by title', async () => {
      await createTestBook({ title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' });
      await createTestBook({ title: 'To Kill a Mockingbird', author: 'Harper Lee' });
      await createTestBook({ title: 'Gatsby Returns', author: 'Another Author' });

      const response = await request(app)
        .get('/api/books/search?q=Gatsby')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.every(book =>
          book.title.toLowerCase().includes('gatsby') ||
          book.author.toLowerCase().includes('gatsby')
        )
      ).toBe(true);
    });

    it('should search books by author', async () => {
      await createTestBook({ title: 'Book 1', author: 'John Doe' });
      await createTestBook({ title: 'Book 2', author: 'Jane Smith' });
      await createTestBook({ title: 'Book 3', author: 'John Smith' });

      const response = await request(app)
        .get('/api/books/search?q=John')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return paginated search results', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestBook({ title: `Test Book ${i}`, author: 'Test Author' });
      }

      const response = await request(app)
        .get('/api/books/search?q=Test&page=1&limit=2')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app)
        .get('/api/books/search')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should not return soft-deleted books in search', async () => {
      await createTestBook({ title: 'Active Book', author: 'Author' });
      await createTestBook({ title: 'Deleted Book', author: 'Author', deletedAt: new Date() });

      const response = await request(app)
        .get('/api/books/search?q=Book')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Active Book');
    });
  });

  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Route not found');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });
});

