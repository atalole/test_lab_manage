# Library Management System

A robust and scalable backend API for managing a library's book inventory with asynchronous wishlist notifications.

## Features

- **CRUD Operations**: Full Create, Read, Update, Delete operations for books
- **Search**: Search books by title or author with partial matching
- **Pagination**: Efficient pagination for large datasets
- **Validation**: Comprehensive input validation (ISBN uniqueness, year validation)
- **Soft Deletes**: Audit trail with soft delete functionality
- **Asynchronous Notifications**: Background job processing for wishlist notifications when books become available
- **RESTful API**: Clean API design following REST principles
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **PostgreSQL**: Database
- **Prisma**: ORM for type-safe database access
- **Bull**: Job queue for asynchronous processing
- **Redis**: Message broker for job queue
- **express-validator**: Input validation
- **Docker**: Containerization for PostgreSQL and Redis
- **Swagger/OpenAPI**: API documentation and interactive testing
- **Winston**: Comprehensive logging with file rotation

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher) OR Docker
- Redis (v6 or higher) OR Docker
- TypeScript (v5 or higher)

## Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db?schema=public"
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging (optional)
LOG_LEVEL=debug
LOG_TO_FILE=false
```

3. **Set up Docker services (Recommended):**

```bash

# Or use the production compose file
docker-compose up -d
```

See [DOCKER.md](./DOCKER.md) for detailed Docker setup instructions.

**Alternative: Manual Setup**

If not using Docker:

```bash
# Start PostgreSQL and Redis manually
# On Ubuntu/Debian
sudo systemctl start postgresql redis

# On macOS with Homebrew
brew services start postgresql redis
```

4. **Set up the database:**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run prisma:seed
```

5. **Build and start the server:**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## API Documentation

### Swagger UI

Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Example requests and responses

### OpenAPI Specification

The OpenAPI 3.0 specification is available at:
- `http://localhost:3000/api-docs.json`

## API Endpoints

### Books

#### Create a Book
```http
POST /api/books
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "9780743273565",
  "publishedYear": 1925,
  "availabilityStatus": "Available"
}
```

#### Get All Books (with pagination and filters)
```http
GET /api/books?page=1&limit=10&author=Fitzgerald&publishedYear=1925
```

#### Get Book by ID
```http
GET /api/books/:id
```

#### Update a Book
```http
PUT /api/books/:id
Content-Type: application/json

{
  "availabilityStatus": "Available"
}
```

**Note**: When updating a book's status from "Borrowed" to "Available", the system automatically triggers an asynchronous notification job for all users who have wishlisted that book.

#### Delete a Book (Soft Delete)
```http
DELETE /api/books/:id
```

#### Search Books
```http
GET /api/books/search?q=gatsby&page=1&limit=10
```

### Health Check
```http
GET /health
```

## Database Schema

### Books Table
- `id`: Primary key
- `title`: Book title
- `author`: Author name
- `isbn`: Unique ISBN (10 or 13 digits)
- `publishedYear`: Year of publication
- `availabilityStatus`: "Available" or "Borrowed"
- `createdAt`: Timestamp
- `updatedAt`: Timestamp
- `deletedAt`: Soft delete timestamp (nullable)

### Wishlist Table
- `id`: Primary key
- `userId`: User ID
- `bookId`: Foreign key to books table
- `createdAt`: Timestamp

## Asynchronous Notification System

When a book's `availabilityStatus` is updated from "Borrowed" to "Available":

1. The API immediately returns a response (non-blocking)
2. A background job is queued using Bull
3. The job processor finds all users who have wishlisted the book
4. For each user, a notification is logged (in production, this would send emails/SMS/push notifications)

The notification message format:
```
Notification prepared for user_id: {userId}: Book [{Title}] is now available.
```

## Validation Rules

- **ISBN**: Must be unique and either 10 or 13 digits
- **Published Year**: Must be a valid year (1000 to current year + 1)
- **Title**: Required, 1-500 characters
- **Author**: Required, 1-200 characters
- **Availability Status**: Must be either "Available" or "Borrowed"

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate ISBN)
- `500`: Internal Server Error

Error response format:
```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // For validation errors
}
```

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seeding script
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma client setup
│   │   ├── redis.ts        # Redis connection
│   │   └── queue.ts        # Bull queue setup
│   ├── controllers/
│   │   └── bookController.ts
│   ├── services/
│   │   ├── bookService.ts
│   │   └── notificationService.ts
│   ├── middleware/
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   └── bookRoutes.ts
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── utils/
│   │   └── errorHandler.ts
│   └── server.ts           # Express app entry point
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── Dockerfile              # Application Docker image
├── tsconfig.json           # TypeScript configuration
├── .env.example
├── package.json
└── README.md
```

## Scalability Features

1. **Database Indexing**: Indexes on frequently queried fields (author, publishedYear, availabilityStatus, deletedAt)
2. **Pagination**: Prevents loading large datasets into memory
3. **Job Queue**: Decouples notification processing from API requests
4. **Connection Pooling**: Prisma handles database connection pooling
5. **Rate Limiting**: Protects API from abuse
6. **Soft Deletes**: Maintains data integrity and audit trail

## Development

### Running Prisma Studio
```bash
npm run prisma:studio
```

This opens a GUI to view and edit your database.

### TypeScript

### Testing

Run the test suite:
```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

For detailed testing guide, see [TESTING.md](./TESTING.md).


```bash
# Build TypeScript to JavaScript
npm run build

# Type checking (via tsconfig.json)
npx tsc --noEmit
```

### Database Migrations
```bash
# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Docker

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# See DOCKER.md for more details
```

### Logging

The application uses Winston for comprehensive logging:

```bash
# View application logs (if file logging enabled)
tail -f logs/combined-$(date +%Y-%m-%d).log

# View error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# View HTTP request logs
tail -f logs/http-$(date +%Y-%m-%d).log
```

**Log Levels:**
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `http`: HTTP requests/responses
- `debug`: Detailed debugging (development only)

See [LOGGING.md](./LOGGING.md) for detailed logging documentation.

## Testing the Notification System

1. Create a book with status "Borrowed"
2. Add it to a user's wishlist (manually via Prisma Studio or API)
3. Update the book's status to "Available"
4. Check the console logs for notification messages

## Testing

The project includes comprehensive test suites:

### Test Structure

- **Service Tests**: Unit tests for business logic (`tests/services/`)
- **Controller Tests**: Unit tests for request handlers (`tests/controllers/`)
- **E2E Tests**: End-to-end API tests (`tests/e2e/`)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Setup

1. **Create a test database:**
```sql
CREATE DATABASE library_db_test;
```

2. **Set up test environment:**
Create a `.env.test` file (or set `NODE_ENV=test`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/library_db_test?schema=public"
NODE_ENV=test
```

3. **Run migrations on test database:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/library_db_test?schema=public" npx prisma migrate deploy
```

### Test Coverage

The test suite covers:
- ✅ All CRUD operations
- ✅ Validation and error handling
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ Soft delete operations
- ✅ Asynchronous notification triggers
- ✅ Edge cases and error scenarios

## Production Considerations

1. **Environment Variables**: Use secure environment variable management
2. **Database**: Use connection pooling and read replicas for scaling
3. **Redis**: Use Redis Cluster for high availability
4. **Monitoring**: Add logging and monitoring (e.g., Winston, Sentry)
5. **Notifications**: Integrate with email/SMS/push notification services
6. **Caching**: Implement Redis caching for frequently accessed data
7. **Load Balancing**: Use a load balancer for multiple server instances

## License

ISC

