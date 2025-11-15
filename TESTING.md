# Testing Guide

This document describes how to run and write tests for the Library Management System API.

## Overview

The project includes:

- **Unit Tests** for services and controllers
- **E2E Tests** for API endpoints
- **Jest** with TypeScript support (`ts-jest`)
- **Supertest** for HTTP assertions

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage Report

```bash
npm run test:coverage
```

This generates a coverage report in the `coverage/` directory.

## Test Structure

```
tests/
├── unit/
│   ├── bookService.test.ts      # Service layer tests
│   └── bookController.test.ts   # Controller layer tests
└── e2e/
    └── book.e2e.test.ts         # End-to-end API tests
```

## Unit Tests

### Service Tests (`tests/unit/bookService.test.ts`)

Tests for business logic in `BookService`:

- **createBook()**: Validates ISBN uniqueness, creates books with default status
- **getBooks()**: Retrieves paginated books with filters (author, publishedYear)
- **getBookById()**: Retrieves single book, throws 404 when not found
- **updateBook()**: Updates books, triggers notifications on status change
- **deleteBook()**: Soft deletes books (sets deletedAt)
- **searchBooks()**: Searches by title/author with pagination

**Key Testing Patterns:**

- Mocks Prisma database client
- Mocks notification queue
- Tests both success and error scenarios
- Verifies proper error messages and HTTP status codes

### Controller Tests (`tests/unit/bookController.test.ts`)

Tests for HTTP request handling in `BookController`:

- Validates request parameter parsing
- Tests HTTP response formatting (status, body)
- Verifies error handling and forwarding to middleware
- Tests pagination and filtering parameter conversion

**Key Testing Patterns:**

- Mocks Express Request/Response objects
- Mocks BookService calls
- Verifies correct status codes and response structure

## E2E Tests

### API Tests (`tests/e2e/book.e2e.test.ts`)

Full request/response flow tests using Supertest:

- **GET /health**: Health check endpoint
- **GET /api/books**: List books with filters and pagination
- **POST /api/books**: Create new book with validation
- **GET /api/books/:id**: Retrieve single book
- **PUT /api/books/:id**: Update book
- **DELETE /api/books/:id**: Soft delete book
- **GET /api/books/search**: Search books by query
- **Error Handling**: 400, 404, 409 responses

**Key Testing Patterns:**

- Mocks BookService (not database)
- Tests validation and error responses
- Validates response format and structure

## Environment Variables for Tests

Tests use these environment variables (can be configured in `jest.setup.ts`):

```bash
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Mocking Strategy

### Database Mocking

The tests mock Prisma to avoid actual database calls:

```typescript
const mockPrismaBook = {
  findUnique: jest.fn(),
  create: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  findFirst: jest.fn(),
  update: jest.fn(),
};

jest.mock('../../src/config/database.js', () => ({
  __esModule: true,
  default: { book: mockPrismaBook },
}));
```

### Service Mocking

E2E tests mock BookService to isolate API layer testing:

```typescript
jest.mock('../../src/services/bookService.js');
```

## Writing New Tests

### Adding a Unit Test

1. Create a test file in `tests/unit/`
2. Import the service/controller to test
3. Mock dependencies
4. Write test cases following existing patterns

Example:

```typescript
describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should do something', async () => {
    // Setup mocks
    mockFunc.mockResolvedValue(expectedValue);

    // Execute
    const result = await MyService.method(input);

    // Assert
    expect(result).toEqual(expectedValue);
    expect(mockFunc).toHaveBeenCalledWith(expectedInput);
  });
});
```

### Adding an E2E Test

1. Add test case to appropriate describe block in `tests/e2e/book.e2e.test.ts`
2. Mock BookService methods as needed
3. Use `request(app).method(route)` for HTTP calls
4. Assert status code and response body

Example:

```typescript
it('should handle the endpoint', async () => {
  (BookService.method as jest.Mock).mockResolvedValue(mockData);

  const res = await request(app).get('/api/endpoint');

  expect(res.status).toBe(200);
  expect(res.body).toEqual(expect.objectContaining({ success: true }));
});
```

## Coverage Goals

- **Services**: >90% line coverage
- **Controllers**: >85% line coverage
- **E2E Routes**: All happy paths and error cases covered

View detailed coverage with:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Debugging Tests

### Run Single Test File

```bash
npm test -- bookService.test.ts
```

### Run Single Test Case

```bash
npm test -- --testNamePattern="should create a book"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Detect Open Handles

```bash
npm test -- --detectOpenHandles
```

## Best Practices

1. **Setup and Teardown**: Always call `jest.clearAllMocks()` in `beforeEach()`
2. **Test Isolation**: Each test should be independent
3. **Meaningful Assertions**: Test both happy paths and error scenarios
4. **Mock External Dependencies**: Database, queues, logging, etc.
5. **Test Names**: Use descriptive names starting with "should"
6. **Arrange-Act-Assert**: Follow AAA pattern in tests
7. **Keep Tests Fast**: Mock slow operations (DB, network)

## Continuous Integration

Tests run automatically on:

- Push to repository
- Pull request creation
- Pre-commit hooks (if configured)

Ensure all tests pass before committing:

```bash
npm test
```

## Troubleshooting

### Port Already in Use (E2E Tests)

If tests fail with "EADDRINUSE: address already in use :::3000":

```bash
lsof -i :3000
kill -9 <PID>
```

### TypeScript Errors in Tests

Ensure `tsconfig.json` includes the tests directory and has correct settings.

### Mock Not Working

- Ensure mock is declared BEFORE importing the module
- Clear mocks between tests with `jest.clearAllMocks()`
- Check that the import path matches the mock path exactly

## References

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
