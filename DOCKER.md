# Docker Setup Guide

This project includes Docker configurations for PostgreSQL and Redis services.

## Docker Compose Files

### `docker-compose.yml`

Production-ready Docker Compose configuration with PostgreSQL and Redis.

### `docker-compose.dev.yml`

Development Docker Compose configuration (same services, different container names).

## Quick Start

### 1. Start Services

```bash
# For development
docker-compose -f docker-compose.dev.yml up -d

# For production
docker-compose up -d
```

### 2. Check Service Status

```bash
docker-compose ps
```

### 3. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 4. Stop Services

```bash
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## Services

### PostgreSQL

- **Image**: `postgres:16-alpine`
- **Port**: `5432`
- **Database**: `library_db`
- **User**: `library_user`
- **Password**: `library_password`

### Redis

- **Image**: `redis:7-alpine`
- **Port**: `6379`
- **Persistence**: Enabled with AOF (Append Only File)

## Environment Variables

When using Docker Compose, update your `.env` file:

```env
# For Docker Compose
DATABASE_URL="postgresql://library_user:library_password@postgres:5432/library_db?schema=public"
REDIS_HOST=redis
REDIS_PORT=6379

# For local development (without Docker)
DATABASE_URL="postgresql://library_user:library_password@localhost:5432/library_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Connecting to Services

### PostgreSQL

```bash
# From host machine
psql -h localhost -U library_user -d library_db

# From within Docker network
docker exec -it library_postgres psql -U library_user -d library_db
```

### Redis

```bash
# From host machine
redis-cli -h localhost -p 6379

# From within Docker network
docker exec -it library_redis redis-cli
```

## Running Migrations

After starting the services:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

## Health Checks

Both services include health checks. You can verify they're healthy:

```bash
docker-compose ps
```

Look for `(healthy)` status next to the service names.

## Volumes

Data is persisted in Docker volumes:

- `postgres_data` or `postgres_dev_data`: PostgreSQL data
- `redis_data` or `redis_dev_data`: Redis data

To backup data:

```bash
docker run --rm -v library_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Troubleshooting

### Port Already in Use

If ports 5432 or 6379 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - '5433:5432' # Use 5433 on host instead
```

### Connection Issues

Ensure services are running and healthy:

```bash
docker-compose ps
docker-compose logs postgres
docker-compose logs redis
```

### Reset Everything

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```
