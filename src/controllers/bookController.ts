import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/bookService.js';
import { BookQueryParams, SearchQueryParams } from '../types/index.js';

export class BookController {
  // Create a new book
  static async createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.createBook(req.body);
      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get paginated list of books
  static async getBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, author, publishedYear } = req.query;
      const params: BookQueryParams = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
        author: author as string | undefined,
        publishedYear: publishedYear ? parseInt(publishedYear as string, 10) : undefined,
      };

      const result = await BookService.getBooks(params);

      res.status(200).json({
        success: true,
        message: 'Books retrieved successfully',
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single book by ID
  static async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.getBookById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Book retrieved successfully',
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a book
  static async updateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.updateBook(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a book (soft delete)
  static async deleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BookService.deleteBook(req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search books
  static async searchBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query, page, limit } :any = req.query;
      const params: SearchQueryParams = {
        q: query as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      };

      const result = await BookService.searchBooks(params);

      res.status(200).json({
        success: true,
        message: 'Search completed successfully',
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

