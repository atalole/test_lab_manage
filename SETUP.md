# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up PostgreSQL Database

Create a PostgreSQL database:

```sql
CREATE DATABASE library_db;
```

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/library_db?schema=public"
PORT=3000
NODE_ENV=development
REDIS_HOST=localhost
REDIS_PORT=6379
```

Replace `username` and `password` with your PostgreSQL credentials.

## Step 4: Set Up Redis

Install and start Redis:

**Ubuntu/Debian:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**

```bash
brew install redis
brew services start redis
```

**Windows:**
Download and install from: https://redis.io/download

## Step 5: Run Database Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Step 6: (Optional) Seed Database

```bash
npm run prisma:seed
```

## Step 7: Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Testing the API

### Create a Book

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

### Get All Books

```bash
curl http://localhost:3000/api/books?page=1&limit=10
```

### Search Books

```bash
curl http://localhost:3000/api/books/search?q=gatsby
```

### Update Book Status (triggers notification)

```bash
curl -X PUT http://localhost:3000/api/books/1 \
  -H "Content-Type: application/json" \
  -d '{
    "availabilityStatus": "Available"
  }'
```

Check the console logs for notification messages!
