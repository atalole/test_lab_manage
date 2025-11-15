import { processWishlistNotifications } from '../../src/services/notificationService.ts';
import prisma from '../../src/config/database.ts';
import logger from '../../src/config/logger.ts';

// Mock prisma and logger modules
jest.mock('../../src/config/database', () => ({
  __esModule: true,
  default: {
    wishlist: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../src/config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processWishlistNotifications', () => {
    it('should process notifications for all users who wishlisted a book', async () => {
      const mockWishlists = [
        { userId: 1 },
        { userId: 2 },
        { userId: 3 },
      ];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(1, 'Test Book');

      expect(result.processed).toBe(3);
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { bookId: 1 },
        select: { userId: true },
      });

      // Verify logger calls for each notification
      expect(logger.info).toHaveBeenCalledTimes(4); // 3 notifications + 1 summary
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('user_id: 1'),
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('user_id: 2'),
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('user_id: 3'),
        expect.any(Object)
      );
    });

    it('should handle books with no wishlist entries', async () => {
      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce([]);

      const result = await processWishlistNotifications(1, 'Unwishlisted Book');

      expect(result.processed).toBe(0);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Processed 0 wishlist notifications'),
        expect.any(Object)
      );
    });

    it('should include book title in notification message', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      await processWishlistNotifications(1, 'The Great Gatsby');

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('The Great Gatsby'),
        expect.any(Object)
      );
    });

    it('should return correct processed count', async () => {
      const mockWishlists = [
        { userId: 1 },
        { userId: 2 },
      ];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(2, 'Count Test Book');

      expect(result.processed).toBe(2);
      expect(result.message).toContain('Processed 2 wishlist notifications');
    });

    it('should handle string bookId conversion', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      // Pass bookId as string
      const result = await processWishlistNotifications('1', 'String ID Test');

      expect(result.processed).toBe(1);
      // Should convert string to number
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { bookId: 1 },
        select: { userId: true },
      });
    });

    it('should notify multiple users when multiple wishlists exist', async () => {
      const mockWishlists = [
        { userId: 1 },
        { userId: 2 },
        { userId: 3 },
        { userId: 4 },
        { userId: 5 },
      ];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(3, 'Popular Book');

      expect(result.processed).toBe(5);
      // 5 individual notifications + 1 summary log
      expect(logger.info).toHaveBeenCalledTimes(6);
      expect(result.message).toContain('Processed 5 wishlist notifications');
    });

    it('should return proper notification result object structure', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(4, 'Structure Test');

      expect(result).toHaveProperty('processed');
      expect(result).toHaveProperty('message');
      expect(typeof result.processed).toBe('number');
      expect(typeof result.message).toBe('string');
    });

    it('should properly format notification messages', async () => {
      const mockWishlists = [{ userId: 42 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      await processWishlistNotifications(5, 'Formatted Message Test');

      // Check that logger was called with properly formatted message
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/Notification prepared for user_id: \d+/),
        expect.any(Object)
      );
    });

    it('should handle book titles with special characters', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(6, "The Book's Title & More: A Story");

      expect(result.processed).toBe(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("The Book's Title & More: A Story"),
        expect.any(Object)
      );
    });

    it('should only process wishlists for the specific book', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(7, 'Book 1');

      expect(result.processed).toBe(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Book 1'),
        expect.any(Object)
      );
      // Verify correct bookId was queried
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { bookId: 7 },
        select: { userId: true },
      });
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (prisma.wishlist.findMany as jest.Mock).mockRejectedValueOnce(error);

      await expect(
        processWishlistNotifications(99, 'Error Test Book')
      ).rejects.toThrow('Database connection failed');
    });

    it('should pass correct parameters to prisma query', async () => {
      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce([]);

      await processWishlistNotifications(100, 'Query Test Book');

      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { bookId: 100 },
        select: { userId: true },
      });
      expect(prisma.wishlist.findMany).toHaveBeenCalledTimes(1);
    });

    it('should pass context metadata to logger', async () => {
      const mockWishlists = [{ userId: 123 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      await processWishlistNotifications(10, 'Metadata Test');

      // Verify logger was called with metadata context
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 123,
          bookId: 10,
          bookTitle: 'Metadata Test',
        })
      );
    });

    it('should return message with book title', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(11, 'Special Book Title');

      expect(result.message).toContain('Special Book Title');
      expect(result.message).toContain('Processed 1 wishlist notifications');
    });

    it('should handle numeric bookId directly', async () => {
      const mockWishlists = [{ userId: 1 }];

      (prisma.wishlist.findMany as jest.Mock).mockResolvedValueOnce(mockWishlists);

      const result = await processWishlistNotifications(42, 'Numeric ID Test');

      expect(result.processed).toBe(1);
      expect(prisma.wishlist.findMany).toHaveBeenCalledWith({
        where: { bookId: 42 },
        select: { userId: true },
      });
    });
  });
});
