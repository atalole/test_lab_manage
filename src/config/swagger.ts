import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description:
        "A robust and scalable backend API for managing a library's book inventory with asynchronous wishlist notifications",
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Book: {
          type: 'object',
          required: [
            'id',
            'title',
            'author',
            'isbn',
            'publishedYear',
            'availabilityStatus',
            'createdAt',
            'updatedAt',
          ],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the book',
              example: 1,
            },
            title: {
              type: 'string',
              description: 'Title of the book',
              example: 'The Great Gatsby',
              minLength: 1,
              maxLength: 500,
            },
            author: {
              type: 'string',
              description: 'Author of the book',
              example: 'F. Scott Fitzgerald',
              minLength: 1,
              maxLength: 200,
            },
            isbn: {
              type: 'string',
              description: 'International Standard Book Number (10 or 13 digits)',
              example: '9780743273565',
              pattern: '^(?:\\d{10}|\\d{13})$',
            },
            publishedYear: {
              type: 'integer',
              description: 'Year the book was published',
              example: 1925,
              minimum: 1000,
              maximum: 2100,
            },
            availabilityStatus: {
              type: 'string',
              enum: ['Available', 'Borrowed'],
              description: 'Current availability status of the book',
              example: 'Available',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the book was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the book was last updated',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft delete flag (true if deleted, false otherwise)',
              example: false,
            },
          },
        },
        BookCreateInput: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'publishedYear'],
          properties: {
            title: {
              type: 'string',
              description: 'Title of the book',
              example: 'The Great Gatsby',
              minLength: 1,
              maxLength: 500,
            },
            author: {
              type: 'string',
              description: 'Author of the book',
              example: 'F. Scott Fitzgerald',
              minLength: 1,
              maxLength: 200,
            },
            isbn: {
              type: 'string',
              description: 'International Standard Book Number (10 or 13 digits)',
              example: '9780743273565',
              pattern: '^(?:\\d{10}|\\d{13})$',
            },
            publishedYear: {
              type: 'integer',
              description: 'Year the book was published',
              example: 1925,
              minimum: 1000,
            },
            availabilityStatus: {
              type: 'string',
              enum: ['Available', 'Borrowed'],
              description: 'Availability status (defaults to "Available" if not provided)',
              example: 'Available',
            },
          },
        },
        BookUpdateInput: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the book',
              example: 'The Great Gatsby',
              minLength: 1,
              maxLength: 500,
            },
            author: {
              type: 'string',
              description: 'Author of the book',
              example: 'F. Scott Fitzgerald',
              minLength: 1,
              maxLength: 200,
            },
            isbn: {
              type: 'string',
              description: 'International Standard Book Number (10 or 13 digits)',
              example: '9780743273565',
              pattern: '^(?:\\d{10}|\\d{13})$',
            },
            publishedYear: {
              type: 'integer',
              description: 'Year the book was published',
              example: 1925,
              minimum: 1000,
            },
            availabilityStatus: {
              type: 'string',
              enum: ['Available', 'Borrowed'],
              description: 'Availability status',
              example: 'Available',
            },
          },
        },
        PaginationResult: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
              example: 1,
              minimum: 1,
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
              example: 10,
              minimum: 1,
              maximum: 100,
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
              example: 50,
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 5,
            },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Response message',
              example: 'Operation completed successfully',
            },
            data: {
              description: 'Response data (varies by endpoint)',
            },
            pagination: {
              $ref: '#/components/schemas/PaginationResult',
            },
            errors: {
              type: 'array',
              description: 'Validation errors (if any)',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'isbn',
                  },
                  message: {
                    type: 'string',
                    example: 'ISBN must be 10 or 13 digits',
                  },
                  value: {
                    description: 'The invalid value',
                  },
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Books',
        description: 'Book management operations',
      },
      {
        name: 'Health',
        description: 'Health check endpoint',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/server.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
