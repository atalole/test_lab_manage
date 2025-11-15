import prisma from '../config/database.ts';
import { NotificationResult } from '../types/index.ts';
import logger from '../config/logger.ts';
import { NOTIFICATION_MESSAGES } from '../utils/notificationMessages.ts';

/**
 * Process wishlist notifications for a book that became available
 * This function is called asynchronously by the job queue
 */
export async function processWishlistNotifications(
  bookId: number | string,
  bookTitle: string,
): Promise<NotificationResult> {
  try {
    const parsedBookId = typeof bookId === 'string' ? parseInt(bookId, 10) : bookId;

    // Find all users who have wishlisted this book
    const wishlists = await prisma.wishlist.findMany({
      where: {
        bookId: parsedBookId,
      },
      select: {
        userId: true,
      },
    });

    // Log notification for each user
    for (const wishlist of wishlists) {
      const notificationMessage = NOTIFICATION_MESSAGES.WISHLIST_AVAILABLE(
        bookTitle,
        wishlist.userId,
      );
      logger.info(notificationMessage, {
        userId: wishlist.userId,
        bookId: parsedBookId,
        bookTitle,
      });

      // In a production system, you would:
      // - Store notifications in a database
      // - Send emails/SMS/push notifications
      // - Use a notification service
    }

    logger.info(NOTIFICATION_MESSAGES.WISHLIST_PROCESSED(wishlists.length, bookTitle), {
      bookId: parsedBookId,
      bookTitle,
      count: wishlists.length,
    });

    return {
      processed: wishlists.length,
      message: `Processed ${wishlists.length} wishlist notifications for book: ${bookTitle}`,
    };
  } catch (error) {
    logger.error(NOTIFICATION_MESSAGES.WISHLIST_PROCESSING_ERROR, {
      bookId: typeof bookId === 'string' ? parseInt(bookId, 10) : bookId,
      bookTitle,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
