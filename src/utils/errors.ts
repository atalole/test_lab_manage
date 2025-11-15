// src/utils/errors.ts

export const BOOK_ERRORS = {
  DUPLICATE_ISBN: {
    message: 'Book with this ISBN already exists',
    statusCode: 409,
  },
  NOT_FOUND: {
    message: 'Book not found',
    statusCode: 404,
  },
} as const;

export const PRISMA_ERRORS = {
  DUPLICATE_CONSTRAINT: {
    message: 'Duplicate entry. This ISBN already exists.',
    statusCode: 409,
  },
  RECORD_NOT_FOUND: {
    message: 'Resource not found',
    statusCode: 404,
  },
} as const;

export const GENERAL_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_FAILED: 'Validation failed',
} as const;
