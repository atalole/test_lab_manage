# Quick Setup Guide

This guide will help you get the Library Management System up and running quickly. Choose either the **Docker method** (recommended) or the **manual setup** method.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Docker** and **Docker Compose** (recommended) - [Download Docker](https://www.docker.com/get-started)
- **Git** (to clone the repository)

## Method 1: Docker Setup (Recommended)

This is the easiest and fastest way to get started. Docker will handle PostgreSQL and Redis for you.

### Step 1: Clone and Install

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd test_lab_manage

# Install Node.js dependencies
npm install
```

### Step 2: Create Environment File

Create a `.env` file in the root directory:

```env
# Database (Docker Compose uses these credentials)
DATABASE_URL="postgresql://library_user:library_password@localhost:5432/library_db?schema=public"
PORT=3000
NODE_ENV=development

# Redis (Docker Compose)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging (optional)
LOG_LEVEL=debug
LOG_TO_FILE=false
```

### Step 3: Start Docker Services

```bash
# Start PostgreSQL and Redis containers
docker-compose up -d

# Verify services are running
docker-compose ps
```

You should see both `postgres` and `redis` services with `(healthy)` status.

### Step 4: Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run prisma:seed
```

### Step 5: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev
```

The server should start on `http://localhost:3000`. You should see:

```
Server is running on port 3000
Environment: development
Log level: debug
Redis connected successfully
```

### Step 6: Verify Installation

1. **Check Health Endpoint:**

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:

   ```json
   {
     "success": true,
     "message": "Server is running",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **Access Swagger Documentation:**
   Open your browser and navigate to: `http://localhost:3000/api-docs`

3. **Test API (Optional):**
   See the [Testing the API](#testing-the-api) section below.

## Method 2: Manual Setup

If you prefer to run PostgreSQL and Redis manually (without Docker):

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up PostgreSQL

**Ubuntu/Debian:**

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

In the PostgreSQL prompt:

```sql
CREATE DATABASE library_db;
CREATE USER library_user WITH PASSWORD 'library_password';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
\q
```

**macOS (Homebrew):**

```bash
# Install PostgreSQL
brew install postgresql@16

# Start PostgreSQL service
brew services start postgresql@16

# Create database and user
createdb library_db
psql library_db
```

In the PostgreSQL prompt:

```sql
CREATE USER library_user WITH PASSWORD 'library_password';
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
\q
```

**Windows:**

1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Use pgAdmin or psql to create the database:
   ```sql
   CREATE DATABASE library_db;
   CREATE USER library_user WITH PASSWORD 'library_password';
   GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;
   ```

### Step 3: Set Up Redis

**Ubuntu/Debian:**

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**macOS (Homebrew):**

```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

**Windows:**

1. Download Redis from [redis.io/download](https://redis.io/download)
2. Or use WSL (Windows Subsystem for Linux) and follow Ubuntu instructions

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database (use your actual PostgreSQL credentials)
DATABASE_URL="postgresql://library_user:library_password@localhost:5432/library_db?schema=public"
PORT=3000
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging (optional)
LOG_LEVEL=debug
LOG_TO_FILE=false
```

**Important:** Replace `library_user` and `library_password` with your actual PostgreSQL credentials if you used different values.

### Step 5: Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed the database with sample data
npm run prisma:seed
```

### Step 6: Start the Server

```bash
# Development mode (with auto-reload)
npm run dev
```

The server should start on `http://localhost:3000`.

### Step 7: Verify Installation

Follow the same verification steps as in Method 1 (Step 6).

## Testing the API

Once your server is running, you can test the API endpoints:

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Create a Book

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "publishedYear": 1925,
    "availabilityStatus": "Borrowed"
  }'
```

Expected response (201 Created):

```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "publishedYear": 1925,
    "availabilityStatus": "Borrowed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

### 3. Get All Books

```bash
curl http://localhost:3000/api/books?page=1&limit=10
```

### 4. Get Book by ID

```bash
curl http://localhost:3000/api/books/1
```

### 5. Search Books

```bash
curl http://localhost:3000/api/books/search?q=gatsby
```

### 6. Update Book Status (Triggers Notification)

```bash
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "availabilityStatus": "Available"
  }'
```

**Note:** When you update a book's status from "Borrowed" to "Available", check the console logs for notification messages if there are users who have wishlisted the book.

### 7. Delete a Book (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/api/books/1
```

## Using Swagger UI

The easiest way to test the API is through the interactive Swagger documentation:

1. Start your server: `npm run dev`
2. Open your browser: `http://localhost:3000/api-docs`
3. Use the "Try it out" feature to test endpoints directly

## Troubleshooting

### Docker Issues

**Ports already in use:**

```bash
# Check what's using the ports
sudo lsof -i :5432  # PostgreSQL
sudo lsof -i :6379  # Redis

# Stop conflicting services or change ports in docker-compose.yml
```

**Services not starting:**

```bash
# Check logs
docker-compose logs postgres
docker-compose logs redis

# Restart services
docker-compose restart
```

**Reset everything:**

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Database Connection Issues

**Error: "Can't reach database server"**

- Verify PostgreSQL is running: `docker-compose ps` (Docker) or `sudo systemctl status postgresql` (manual)
- Check DATABASE_URL in `.env` file
- Verify credentials match your PostgreSQL setup

**Error: "Database does not exist"**

- Create the database: `CREATE DATABASE library_db;`
- Or run migrations: `npm run prisma:migrate`

**Error: "Prisma Client not generated"**

```bash
npm run prisma:generate
```

### Redis Connection Issues

**Error: "Redis connection error"**

- Verify Redis is running: `docker-compose ps` (Docker) or `redis-cli ping` (manual)
- Check REDIS_HOST and REDIS_PORT in `.env` file
- For Docker: ensure REDIS_HOST=localhost (not 'redis') when connecting from host

**Redis not responding:**

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping
# Should return: PONG
```

### Server Issues

**Port 3000 already in use:**

```bash
# Change PORT in .env file
PORT=3001

# Or find and kill the process using port 3000
sudo lsof -i :3000
kill -9 <PID>
```

**TypeScript compilation errors:**

```bash
# Clean and rebuild
rm -rf dist node_modules/.prisma
npm install
npm run prisma:generate
npm run build
```

**Module not found errors:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Migration Issues

**Error: "Migration failed"**

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually fix and retry
npm run prisma:migrate
```

**Error: "Migration already applied"**

```bash
# Mark migration as applied
npx prisma migrate resolve --applied <migration-name>
```

## Next Steps

After successful setup:

1. **Explore the API:** Visit `http://localhost:3000/api-docs` for interactive documentation
2. **Read the Documentation:**
   - [README.md](./README.md) - Complete project documentation
   - [DOCKER.md](./DOCKER.md) - Detailed Docker guide
   - [TESTING.md](./TESTING.md) - Testing guide
   - [LOGGING.md](./LOGGING.md) - Logging configuration
   - [SWAGGER.md](./SWAGGER.md) - API documentation guide
3. **Run Tests:**
   ```bash
   npm test
   ```
4. **Start Developing:** Check out the project structure in [README.md](./README.md)

## Quick Reference

### Essential Commands

```bash
# Start development server
npm run dev

# Start Docker services
docker-compose up -d

# Stop Docker services
docker-compose down

# Run database migrations
npm run prisma:migrate

# Generate Prisma Client
npm run prisma:generate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Run tests
npm test

# Build for production
npm run build
npm start
```

### Environment Variables

| Variable       | Description                                | Default                  | Required |
| -------------- | ------------------------------------------ | ------------------------ | -------- |
| `DATABASE_URL` | PostgreSQL connection string               | -                        | Yes      |
| `PORT`         | Server port                                | 3000                     | No       |
| `NODE_ENV`     | Environment (development/production)       | development              | No       |
| `REDIS_HOST`   | Redis host                                 | localhost                | Yes      |
| `REDIS_PORT`   | Redis port                                 | 6379                     | No       |
| `LOG_LEVEL`    | Logging level (error/warn/info/http/debug) | debug (dev), info (prod) | No       |
| `LOG_TO_FILE`  | Enable file logging ("true"/"false")       | false                    | No       |

## Need Help?

If you encounter issues not covered here:

1. Check the [README.md](./README.md) for comprehensive documentation
2. Review error logs in the console or log files
3. Verify all prerequisites are installed correctly
4. Ensure all environment variables are set correctly
5. Check that Docker services (if used) are healthy: `docker-compose ps`
