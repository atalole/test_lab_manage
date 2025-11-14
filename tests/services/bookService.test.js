import { BookService } from '../../src/services/bookService.js';
import { AppError } from '../../src/utils/errorHandler.js';
import { cleanDatabase, createTestBook, generateUniqueISBN } from '../helpers/testHelpers.js';
import { notificationQueue } from '../../src/config/queue.js';
import prisma from '../../src/config/database.js';

// Mock the notification queue
jest.mock('../../src/config/queue.js', () => ({
  notificationQueue: {
    add: jest.fn(),
  },
}));

describe('BookService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe('createBook', () => {
    it('should create a new book successfully', async () => {
      const bookData = {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: generateUniqueISBN(),
        publishedYear: 1925,
        availabilityStatus: 'Available',
      };

      const book = await BookService.createBook(bookData);

      expect(book).toHaveProperty('id');
      expect(book.title).toBe(bookData.title);
      expect(book.author).toBe(bookData.author);
      expect(book.isbn).toBe(bookData.isbn);
      expect(book.publishedYear).toBe(bookData.publishedYear);
      expect(book.availabilityStatus).toBe(bookData.availabilityStatus);
    });

    it('should default to Available status if not provided', async () => {
      const bookData = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: generateUniqueISBN(),
        publishedYear: 2020,
      };

      const book = await BookService.createBook(bookData);
      expect(book.availabilityStatus).toBe('Available');
    });

    it('should throw error for duplicate ISBN', async () => {
      const isbn = generateUniqueISBN();
      const bookData = {
        title: 'First Book',
        author: 'Author One',
        isbn,
        publishedYear: 2020,
      };

      await BookService.createBook(bookData);

      const duplicateBook = {
        title: 'Second Book',
        author: 'Author Two',
        isbn,
        publishedYear: 2021,
      };

      await expect(BookService.createBook(duplicateBook)).rejects.toThrow(AppError);
      await expect(BookService.createBook(duplicateBook)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });
  });

  describe('getBooks', () => {
    it('should return paginated list of books', async () => {
      // Create test books
      await createTestBook({ title: 'Book 1', author: 'Author 1' });
      await createTestBook({ title: 'Book 2', author: 'Author 2' });
      await createTestBook({ title: 'Book 3', author: 'Author 3' });

      const result = await BookService.getBooks({ page: 1, limit: 2 });

      expect(result.books).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should filter books by author', async () => {
      await createTestBook({ title: 'Book 1', author: 'John Doe' });
      await createTestBook({ title: 'Book 2', author: 'Jane Smith' });
      await createTestBook({ title: 'Book 3', author: 'John Doe' });

      const result = await BookService.getBooks({ page: 1, limit: 10, author: 'John' });

      expect(result.books).toHaveLength(2);
      expect(result.books.every(book => book.author.includes('John'))).toBe(true);
    });

    it('should filter books by publishedYear', async () => {
      await createTestBook({ title: 'Book 1', publishedYear: 2020 });
      await createTestBook({ title: 'Book 2', publishedYear: 2021 });
      await createTestBook({ title: 'Book 3', publishedYear: 2020 });

      const result = await BookService.getBooks({ page: 1, limit: 10, publishedYear: 2020 });

      expect(result.books).toHaveLength(2);
      expect(result.books.every(book => book.publishedYear === 2020)).toBe(true);
    });

    it('should not return soft-deleted books', async () => {
      const book = await createTestBook({ title: 'Active Book' });
      await createTestBook({ title: 'Deleted Book', deletedAt: new Date() });

      const result = await BookService.getBooks({ page: 1, limit: 10 });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].title).toBe('Active Book');
    });
  });

  describe('getBookById', () => {
    it('should return a book by ID', async () => {
      const createdBook = await createTestBook({ title: 'Test Book' });

      const book = await BookService.getBookById(createdBook.id);

      expect(book.id).toBe(createdBook.id);
      expect(book.title).toBe('Test Book');
    });

    it('should throw error if book not found', async () => {
      await expect(BookService.getBookById(99999)).rejects.toThrow(AppError);
      await expect(BookService.getBookById(99999)).rejects.toThrow('Book not found');
    });

    it('should throw error if book is soft-deleted', async () => {
      const book = await createTestBook({ title: 'Deleted Book' });
      await BookService.deleteBook(book.id);

      await expect(BookService.getBookById(book.id)).rejects.toThrow('Book not found');
    });
  });

  describe('updateBook', () => {
    it('should update book details', async () => {
      const book = await createTestBook({ title: 'Original Title' });

      const updatedBook = await BookService.updateBook(book.id, {
        title: 'Updated Title',
        author: 'Updated Author',
      });

      expect(updatedBook.title).toBe('Updated Title');
      expect(updatedBook.author).toBe('Updated Author');
    });

    it('should trigger notification when status changes from Borrowed to Available', async () => {
      const book = await createTestBook({
        title: 'Borrowed Book',
        availabilityStatus: 'Borrowed',
      });

      await BookService.updateBook(book.id, {
        availabilityStatus: 'Available',
      });

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

      await BookService.updateBook(book.id, {
        availabilityStatus: 'Borrowed',
      });

      expect(notificationQueue.add).not.toHaveBeenCalled();
    });

    it('should throw error if book not found', async () => {
      await expect(BookService.updateBook(99999, { title: 'New Title' })).rejects.toThrow(
        AppError
      );
      await expect(BookService.updateBook(99999, { title: 'New Title' })).rejects.toThrow(
        'Book not found'
      );
    });

    it('should throw error for duplicate ISBN on update', async () => {
      const book1 = await createTestBook({ isbn: generateUniqueISBN() });
      const book2 = await createTestBook({ isbn: generateUniqueISBN() });

      await expect(
        BookService.updateBook(book2.id, { isbn: book1.isbn })
      ).rejects.toThrow('Book with this ISBN already exists');
    });
  });

  describe('deleteBook', () => {
    it('should soft delete a book', async () => {
      const book = await createTestBook({ title: 'Book to Delete' });

      const result = await BookService.deleteBook(book.id);

      expect(result.message).toBe('Book deleted successfully');

      // Verify soft delete
      const deletedBook = await prisma.book.findUnique({
        where: { id: book.id },
      });
      expect(deletedBook.deletedAt).not.toBeNull();
    });

    it('should throw error if book not found', async () => {
      await expect(BookService.deleteBook(99999)).rejects.toThrow(AppError);
      await expect(BookService.deleteBook(99999)).rejects.toThrow('Book not found');
    });

    it('should throw error if book already deleted', async () => {
      const book = await createTestBook();
      await BookService.deleteBook(book.id);

      await expect(BookService.deleteBook(book.id)).rejects.toThrow('Book not found');
    });
  });

  describe('searchBooks', () => {
    it('should search books by title', async () => {
      await createTestBook({ title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' });
      await createTestBook({ title: 'To Kill a Mockingbird', author: 'Harper Lee' });
      await createTestBook({ title: 'Gatsby Returns', author: 'Another Author' });

      const result = await BookService.searchBooks({ query: 'Gatsby', page: 1, limit: 10 });

      expect(result.books.length).toBeGreaterThan(0);
      expect(result.books.every(book => 
        book.title.toLowerCase().includes('gatsby') || 
        book.author.toLowerCase().includes('gatsby')
      )).toBe(true);
    });

    it('should search books by author', async () => {
      await createTestBook({ title: 'Book 1', author: 'John Doe' });
      await createTestBook({ title: 'Book 2', author: 'Jane Smith' });
      await createTestBook({ title: 'Book 3', author: 'John Smith' });

      const result = await BookService.searchBooks({ query: 'John', page: 1, limit: 10 });

      expect(result.books.length).toBeGreaterThan(0);
      expect(result.books.every(book => 
        book.title.toLowerCase().includes('john') || 
        book.author.toLowerCase().includes('john')
      )).toBe(true);
    });

    it('should return paginated search results', async () => {
      // Create multiple books
      for (let i = 0; i < 5; i++) {
        await createTestBook({ title: `Test Book ${i}`, author: 'Test Author' });
      }

      const result = await BookService.searchBooks({ query: 'Test', page: 1, limit: 2 });

      expect(result.books.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    it('should not return soft-deleted books in search', async () => {
      const book = await createTestBook({ title: 'Active Book', author: 'Author' });
      await createTestBook({ title: 'Deleted Book', author: 'Author', deletedAt: new Date() });

      const result = await BookService.searchBooks({ query: 'Book', page: 1, limit: 10 });

      expect(result.books).toHaveLength(1);
      expect(result.books[0].title).toBe('Active Book');
    });
  });
});

