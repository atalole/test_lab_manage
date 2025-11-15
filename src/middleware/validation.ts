import { body, query, ValidationChain } from 'express-validator';
import { validationErrorHandler } from '../utils/errorHandler.ts';

// Book creation validation
export const validateCreateBook: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Author must be between 1 and 200 characters'),

  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required')
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN must be 10 or 13 digits'),

  body('publishedYear')
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be a valid year'),

  body('availabilityStatus')
    .optional()
    .isIn(['Available', 'Borrowed'])
    .withMessage('Availability status must be either "Available" or "Borrowed"'),

  validationErrorHandler as any,
];

// Book update validation
export const validateUpdateBook: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('author')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Author cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('Author must be between 1 and 200 characters'),

  body('isbn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('ISBN cannot be empty')
    .matches(/^(?:\d{10}|\d{13})$/)
    .withMessage('ISBN must be 10 or 13 digits'),

  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be a valid year'),

  body('availabilityStatus')
    .optional()
    .isIn(['Available', 'Borrowed'])
    .withMessage('Availability status must be either "Available" or "Borrowed"'),

  validationErrorHandler as any,
];

// Pagination and filter validation
export const validateQueryParams: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('author').optional().trim().notEmpty().withMessage('Author filter cannot be empty'),

  query('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
    .withMessage('Published year must be a valid year'),

  validationErrorHandler as any,
];

// Search validation
export const validateSearch: ValidationChain[] = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be between 1 and 200 characters'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validationErrorHandler as any,
];
