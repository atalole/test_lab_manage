import { processWishlistNotifications } from '../../src/services/notificationService.js';
import { cleanDatabase, createTestBook, createTestWishlist } from '../helpers/testHelpers.js';
import prisma from '../../src/config/database.js';

// Mock console.log to capture notification messages
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

describe('NotificationService', () => {
  beforeEach(async () => {
    await cleanDatabase();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  describe('processWishlistNotifications', () => {
    it('should process notifications for all users who wishlisted a book', async () => {
      const book = await createTestBook({ title: 'Test Book' });
      
      // Create wishlist entries for multiple users
      await createTestWishlist(1, book.id);
      await createTestWishlist(2, book.id);
      await createTestWishlist(3, book.id);

      const result = await processWishlistNotifications(book.id, book.title);

      expect(result.processed).toBe(3);
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      // Verify notification messages
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification prepared for user_id: 1')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification prepared for user_id: 2')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Notification prepared for user_id: 3')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test Book')
      );
    });

    it('should handle books with no wishlist entries', async () => {
      const book = await createTestBook({ title: 'Unwishlisted Book' });

      const result = await processWishlistNotifications(book.id, book.title);

      expect(result.processed).toBe(0);
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(result.message).toContain('Processed 0 wishlist notifications');
    });

    it('should include book title in notification message', async () => {
      const book = await createTestBook({ title: 'The Great Gatsby' });
      await createTestWishlist(1, book.id);

      await processWishlistNotifications(book.id, book.title);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('The Great Gatsby')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('is now available')
      );
    });

    it('should handle multiple wishlists for the same user and book', async () => {
      const book = await createTestBook({ title: 'Test Book' });
      
      // Note: The schema has a unique constraint on [userId, bookId],
      // so this test verifies that constraint works
      await createTestWishlist(1, book.id);

      // Attempting to create duplicate should fail due to unique constraint
      await expect(
        createTestWishlist(1, book.id)
      ).rejects.toThrow();
    });

    it('should return correct processed count', async () => {
      const book = await createTestBook({ title: 'Count Test Book' });
      
      await createTestWishlist(1, book.id);
      await createTestWishlist(2, book.id);

      const result = await processWishlistNotifications(book.id, book.title);

      expect(result.processed).toBe(2);
      expect(result.message).toContain('Processed 2 wishlist notifications');
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid book ID
      await expect(
        processWishlistNotifications(99999, 'Non-existent Book')
      ).resolves.toBeDefined();
      
      // Should return result with 0 processed
      const result = await processWishlistNotifications(99999, 'Non-existent Book');
      expect(result.processed).toBe(0);
    });
  });
});

