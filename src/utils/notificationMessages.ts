// src/utils/notificationMessages.ts

export const NOTIFICATION_MESSAGES = {
  WISHLIST_AVAILABLE: (bookTitle: string, userId: number | string) =>
    `Notification prepared for user_id: ${userId}: Book [${bookTitle}] is now available.`,
  WISHLIST_PROCESSED: (count: number, bookTitle: string) =>
    `Processed ${count} wishlist notifications for book: ${bookTitle}`,
  WISHLIST_PROCESSING_ERROR: 'Error processing wishlist notifications',
} as const;
