import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '../config/logger.ts';
import { PRISMA_ERRORS, GENERAL_ERRORS } from './errors.ts';

// Validation error handler middleware
export const validationErrorHandler = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      method: req.method,
      url: req.originalUrl,
      errors: errors.array(),
      body: req.body,
    });
    res.status(400).json({
      success: false,
      message: GENERAL_ERRORS.VALIDATION_FAILED,
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Extended Error interface for Prisma errors
interface PrismaError extends Error {
  code?: string;
  status?: number;
  meta?: {
    target?: string[];
  };
}

// Extended Error interface for AppError
export interface AppErrorInterface extends Error {
  status?: number;
  isOperational?: boolean;
}

// Global error handler
// IMPORTANT: Must have 4 parameters (err, req, res, next) for Express to recognize it as error middleware
export const errorHandler = (
  err: AppErrorInterface | PrismaError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err?.status || 500;
  const isOperational = 'isOperational' in err && err.isOperational;

  // Log error with appropriate level
  if (status >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      status,
      isOperational,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      code: 'code' in err ? err.code : undefined,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      status,
      isOperational,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      code: 'code' in err ? err.code : undefined,
    });
  }

  // Prisma unique constraint error
  if ('code' in err && err.code === 'P2002') {
    res.status(409).json({
      success: false,
      status,
      message: PRISMA_ERRORS.DUPLICATE_CONSTRAINT.message,
    });
    return;
  }

  // Prisma record not found
  if ('code' in err && err.code === 'P2025') {
    res.status(404).json({
      success: false,
      status,
      message: PRISMA_ERRORS.RECORD_NOT_FOUND.message,
    });
    return;
  }

  // Default error
  res.status(status).json({
    success: false,
    status,
    message: err.message || GENERAL_ERRORS.INTERNAL_SERVER_ERROR,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Custom error class
export class AppError extends Error implements AppErrorInterface {
  status: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.status = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
