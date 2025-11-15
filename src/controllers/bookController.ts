import { Request, Response, NextFunction } from 'express';
import { BookService } from '../services/bookService.ts';

import { BookQueryParams, SearchQueryParams } from '../types/index.ts';
import { BOOK_MESSAGES } from '../utils/messages.ts';

export class BookController {
  private messages;

  constructor(messages = BOOK_MESSAGES) {
    this.messages = messages;
  }
  // Create a new book
  async createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.createBook(req.body);
      res.status(201).json({
        success: true,
        message: this.messages.CREATED,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get paginated list of books
  async getBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        message: this.messages.RETRIEVED_ALL,
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single book by ID
  async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.getBookById(req.params.id);
      res.status(200).json({
        success: true,
        message: this.messages.RETRIEVED,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a book
  async updateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await BookService.updateBook(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: this.messages.UPDATED,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a book (soft delete)
  async deleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await BookService.deleteBook(req.params.id);
      res.status(200).json({
        success: true,
        message: this.messages.DELETED,
      });
    } catch (error) {
      next(error);
    }
  }

  // Search books
  async searchBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: query, page, limit }: any = req.query;
      const params: SearchQueryParams = {
        query: query as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      };

      const result = await BookService.searchBooks(params);

      res.status(200).json({
        success: true,
        message: this.messages.SEARCH_COMPLETED,
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}
