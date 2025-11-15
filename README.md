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
- **Security**: Helmet.js for security headers, CORS support, and rate limiting
- **API Documentation**: Interactive Swagger/OpenAPI documentation
- **Logging**: Comprehensive logging with Winston and file rotation

## Tech Stack

- **TypeScript**: Type-safe JavaScript (v5.5.4)
- **Node.js**: Runtime environment (v18 or higher)
- **Express.js**: Web framework (v4.21.1)
- **PostgreSQL**: Database (v16 via Docker)
- **Prisma**: ORM for type-safe database access (v5.19.1)
- **Bull**: Job queue for asynchronous processing (v4.13.0)
- **Redis**: Message broker for job queue (v7 via Docker)
- **express-validator**: Input validation (v7.2.0)
- **Docker**: Containerization for PostgreSQL and Redis
- **Swagger/OpenAPI**: API documentation and interactive testing
- **Winston**: Comprehensive logging with file rotation (v3.15.0)
- **Jest**: Testing framework with TypeScript support

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher) OR Docker
- Redis (v6 or higher) OR Docker
- TypeScript (v5 or higher)
- npm or yarn

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

**Note**: When using Docker Compose, use these values:

```env
DATABASE_URL="postgresql://library_user:library_password@localhost:5432/library_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

3. **Set up Docker services (Recommended):**

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis containers. See [DOCKER.md](./DOCKER.md) for detailed Docker setup instructions.

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
# Development mode (with auto-reload using tsx)
npm run dev

# Production mode
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

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

For detailed Swagger documentation, see [SWAGGER.md](./SWAGGER.md).

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

**Response**: `201 Created`

#### Get All Books (with pagination and filters)

```http
GET /api/books?page=1&limit=10&author=Fitzgerald&publishedYear=1925
```

**Query Parameters**:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `author` (optional): Filter by author (partial match, case-insensitive)
- `publishedYear` (optional): Filter by published year

**Response**: `200 OK` with paginated results

#### Get Book by ID

```http
GET /api/books/:id
```

**Response**: `200 OK` or `404 Not Found`

#### Update a Book

```http
PUT /api/books/:id
Content-Type: application/json

{
  "availabilityStatus": "Available"
}
```

**Note**: When updating a book's status from "Borrowed" to "Available", the system automatically triggers an asynchronous notification job for all users who have wishlisted that book. The response includes an `X-Notification-Triggered` header indicating if notifications were queued.

**Response**: `200 OK` or `404 Not Found` or `400 Bad Request`

#### Delete a Book (Soft Delete)

```http
DELETE /api/books/:id
```

**Response**: `200 OK` or `404 Not Found`

#### Search Books

```http
GET /api/books/search?q=gatsby&page=1&limit=10
```

**Query Parameters**:

- `q` (required): Search query (searches in title and author)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response**: `200 OK` with paginated search results

### Health Check

```http
GET /health
```

**Response**: `200 OK` with server status and timestamp

## Database Schema

### Books Table

- `id`: Primary key (integer, auto-increment)
- `title`: Book title (string, 1-500 characters)
- `author`: Author name (string, 1-200 characters)
- `isbn`: Unique ISBN (string, 10 or 13 digits)
- `publishedYear`: Year of publication (integer, 1000-2100)
- `availabilityStatus`: "Available" or "Borrowed" (string, default: "Available")
- `createdAt`: Timestamp (DateTime)
- `updatedAt`: Timestamp (DateTime, auto-updated)
- `deletedAt`: Soft delete timestamp (DateTime, nullable)

**Indexes**: `author`, `publishedYear`, `availabilityStatus`, `deletedAt`

### Wishlist Table

- `id`: Primary key (integer, auto-increment)
- `userId`: User ID (integer)
- `bookId`: Foreign key to books table (integer)
- `createdAt`: Timestamp (DateTime)

**Indexes**: `bookId`, `userId`
**Unique Constraint**: `(userId, bookId)`

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

**Testing the Notification System**:

1. Create a book with status "Borrowed"
2. Add it to a user's wishlist (manually via Prisma Studio or API)
3. Update the book's status to "Available"
4. Check the console logs for notification messages

## Validation Rules

- **ISBN**: Must be unique and either 10 or 13 digits
- **Published Year**: Must be a valid year (1000 to 2100)
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
  "errors": [
    {
      "field": "isbn",
      "message": "ISBN must be 10 or 13 digits",
      "value": "invalid"
    }
  ]
}
```

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeding script
│   └── migrations/         # Database migration files
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma client setup
│   │   ├── redis.ts        # Redis connection
│   │   ├── queue.ts        # Bull queue setup
│   │   ├── logger.ts        # Winston logger configuration
│   │   └── swagger.ts       # Swagger/OpenAPI configuration
│   ├── controllers/
│   │   └── bookController.ts
│   ├── services/
│   │   ├── bookService.ts
│   │   └── notificationService.ts
│   ├── middleware/
│   │   ├── validation.ts    # Request validation middleware
│   │   ├── errorHandler.ts  # Global error handler
│   │   └── logger.ts        # HTTP request logger
│   ├── routes/
│   │   └── bookRoutes.ts
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   ├── utils/
│   │   ├── errorHandler.ts  # Error utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   ├── messages.ts      # Success/error messages
│   │   └── notificationMessages.ts
│   └── server.ts            # Express app entry point
├── tests/
│   ├── controllers/         # Controller unit tests
│   ├── services/            # Service unit tests
│   ├── e2e/                 # End-to-end tests
│   ├── helpers/             # Test helper functions
│   ├── setup.js             # Test setup configuration
│   └── README.md
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Application Docker image
├── jest.config.js           # Jest configuration
├── jest.setup.ts            # Jest setup file
├── tsconfig.json            # TypeScript configuration
├── package.json
└── README.md
```

## Scalability Features

1. **Database Indexing**: Indexes on frequently queried fields (author, publishedYear, availabilityStatus, deletedAt)
2. **Pagination**: Prevents loading large datasets into memory
3. **Job Queue**: Decouples notification processing from API requests
4. **Connection Pooling**: Prisma handles database connection pooling
5. **Rate Limiting**: Protects API from abuse (100 requests per 15 minutes per IP)
6. **Soft Deletes**: Maintains data integrity and audit trail
7. **Security Headers**: Helmet.js provides security headers
8. **CORS**: Configurable Cross-Origin Resource Sharing

## Development

### Running Prisma Studio

```bash
npm run prisma:studio
```

This opens a GUI to view and edit your database.

### TypeScript

```bash
# Build TypeScript to JavaScript
npm run build

# Type checking (via tsconfig.json)
npx tsc --noEmit
```

### Testing

Run the test suite:

```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

For detailed testing guide, see [TESTING.md](./TESTING.md).

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

**Log Levels**:

- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `http`: HTTP requests/responses
- `debug`: Detailed debugging (development only)

**Environment Variables**:

- `LOG_LEVEL`: Set log level (error, warn, info, http, debug)
- `LOG_TO_FILE`: Enable file logging ("true" or "false", string)

See [LOGGING.md](./LOGGING.md) for detailed logging documentation.

### Code Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

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
REDIS_HOST=localhost
REDIS_PORT=6379
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

1. **Environment Variables**: Use secure environment variable management (e.g., AWS Secrets Manager, HashiCorp Vault)
2. **Database**: Use connection pooling and read replicas for scaling
3. **Redis**: Use Redis Cluster for high availability
4. **Monitoring**: Add application monitoring (e.g., Sentry, DataDog, New Relic)
5. **Notifications**: Integrate with email/SMS/push notification services (SendGrid, Twilio, Firebase)
6. **Caching**: Implement Redis caching for frequently accessed data
7. **Load Balancing**: Use a load balancer for multiple server instances
8. **HTTPS**: Always use HTTPS in production
9. **API Documentation**: Consider adding authentication to `/api-docs` endpoint in production
10. **Logging**: Ensure proper log aggregation and monitoring in production
11. **Database Backups**: Implement regular database backups
12. **Health Checks**: Set up health check monitoring for all services

## Additional Documentation

- [DOCKER.md](./DOCKER.md) - Detailed Docker setup and usage
- [SETUP.md](./SETUP.md) - Quick setup guide
- [TESTING.md](./TESTING.md) - Comprehensive testing documentation
- [LOGGING.md](./LOGGING.md) - Logging configuration and usage
- [SWAGGER.md](./SWAGGER.md) - Swagger/OpenAPI documentation guide

## Scripts Reference

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:seed` - Seed the database
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run verify` - Run tests (alias for `npm test`)

## License

ISC
