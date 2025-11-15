import Bull, { Job } from 'bull';
import { processWishlistNotifications } from '../services/notificationService.ts';
import { NotificationJobData } from '../types/index.ts';
import logger from './logger.ts';

// Create notification queue
export const notificationQueue = new Bull<NotificationJobData>('wishlist-notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Process jobs
notificationQueue.process('wishlist-notification',async (job: Job<NotificationJobData>) => {
  const { bookId, bookTitle } = job.data;
  console.log(`Processing notification job for bookId: ${bookId}, bookTitle: ${bookTitle}`);
  await processWishlistNotifications(bookId, bookTitle);
});

// Event handlers
notificationQueue.on('completed', (job: Job<NotificationJobData>) => {
  logger.info('Notification job completed', {
    jobId: job.id,
    bookId: job.data.bookId,
    bookTitle: job.data.bookTitle,
  });
});

notificationQueue.on('failed', (job: Job<NotificationJobData> | undefined, err: Error) => {
  logger.error('Notification job failed', {
    jobId: job?.id,
    bookId: job?.data.bookId,
    bookTitle: job?.data.bookTitle,
    error: err.message,
    stack: err.stack,
  });
});

notificationQueue.on('error', (error: Error) => {
  logger.error('Notification queue error', {
    error: error.message,
    stack: error.stack,
  });
});

export default notificationQueue;

