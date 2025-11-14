import { Book, Wishlist } from '@prisma/client';

// Book related types
export type AvailabilityStatus = 'Available' | 'Borrowed';

export interface BookCreateInput {
  title: string;
  author: string;
  isbn: string;
  publishedYear: number;
  availabilityStatus?: AvailabilityStatus;
}

export interface BookUpdateInput {
  title?: string;
  author?: string;
  isbn?: string;
  publishedYear?: number;
  availabilityStatus?: AvailabilityStatus;
}

export interface BookResponse extends Book {
  deletedAt: Date | null;
}

export interface BookWithWishlists extends Book {
  wishlists: Wishlist[];
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationResult;
}

// Query filter types
export interface BookQueryParams extends PaginationParams {
  author?: string;
  publishedYear?: number;
}

export interface SearchQueryParams extends PaginationParams {
  q: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
  pagination?: PaginationResult;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Service response types
export interface GetBooksResult {
  books: Book[];
  pagination: PaginationResult;
}

export interface SearchBooksResult {
  books: Book[];
  pagination: PaginationResult;
}

export interface DeleteBookResult {
  message: string;
}

// Notification types
export interface NotificationJobData {
  bookId: number;
  bookTitle: string;
}

export interface NotificationResult {
  processed: number;
  message: string;
}

// Express Request extensions
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: number;
    email: string;
  };
}

