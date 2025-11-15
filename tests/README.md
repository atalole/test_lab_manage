# Test Suite Documentation

## Overview

This directory contains comprehensive test suites for the Library Management System:
- **Service Tests**: Test business logic in isolation
- **Controller Tests**: Test request/response handling
- **E2E Tests**: Test complete API workflows

## Test Structure

```
tests/
├── setup.js                 # Global test setup
├── helpers/
│   ├── testHelpers.js      # Database utilities and test data factories
│   └── testApp.js          # Express app setup for testing
├── services/
│   ├── bookService.test.js
│   └── notificationService.test.js
├── controllers/
│   └── bookController.test.js
└── e2e/
    └── books.e2e.test.js
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test -- tests/services/bookService.test.ts
```

```bash
npm test -- tests/services/notificationService.test.ts
```

## Test Database Setup

Tests use a separate test database to avoid affecting development data.

1. Create test database:
```sql
CREATE DATABASE library_db_test;
```

2. Run migrations:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/library_db_test?schema=public" npx prisma migrate deploy
```

## Test Utilities

### `testHelpers.js`

Provides utilities for test data creation:
- `cleanDatabase()`: Cleans all test data
- `createTestBook(overrides)`: Creates a test book
- `createTestWishlist(userId, bookId)`: Creates a wishlist entry
- `generateUniqueISBN()`: Generates unique ISBNs for tests

### `testApp.js`

Creates an Express app instance for E2E testing without starting a server.

## Writing New Tests

### Service Test Example
```javascript
import { BookService } from '../../src/services/bookService.js';
import { cleanDatabase, createTestBook } from '../helpers/testHelpers.js';

describe('BookService', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should do something', async () => {
    const book = await createTestBook();
    // Test logic
  });
});
```

### E2E Test Example
```javascript
import request from 'supertest';
import createTestApp from '../helpers/testApp.js';

const app = createTestApp();

describe('API Endpoint', () => {
  it('should handle request', async () => {
    const response = await request(app)
      .get('/api/books')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

## Mocking

- **Notification Queue**: Mocked in service and E2E tests to avoid Redis dependency
- **Database**: Uses real database for integration tests (test database)

## Best Practices

1. Always clean the database in `beforeEach` for test isolation
2. Use helper functions for creating test data
3. Test both success and error cases
4. Use descriptive test names
5. Keep tests independent (no test should depend on another)
6. Mock external dependencies (Redis, external APIs)

