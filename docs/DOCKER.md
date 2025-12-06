# Docker Deployment Guide

This guide explains how to deploy the Hono application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### 1. Set up environment variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and update the values, especially the JWT secrets for production:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_RESET_SECRET=$(openssl rand -base64 32)
```

### 2. Build and run with Docker Compose

```bash
# Build and start all services (postgres, redis, app)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (clears database data)
docker-compose down -v
```

## Services

The docker-compose setup includes:

- **PostgreSQL** - Database on port 5432
- **Redis** - Cache/session store on port 6379
- **Hono App** - Your application on port 3000

## Development vs Production

### Development (with hot reload)

For local development with hot reload, use:

```bash
pnpm install
pnpm dev
```

### Production (Docker)

For production deployment:

```bash
# Build the production image
docker-compose build

# Start in production mode
docker-compose up -d

# Check health
curl http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Application port |
| `NODE_ENV` | `production` | Environment mode |
| `DATABASE_URL` | - | PostgreSQL connection string |
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `hono_db` | PostgreSQL database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_PASSWORD` | `redis_password` | Redis password |
| `JWT_SECRET` | - | JWT signing secret |
| `JWT_REFRESH_SECRET` | - | JWT refresh token secret |
| `JWT_RESET_SECRET` | - | JWT reset token secret |

## Docker Commands

### Build the image

```bash
docker build -t hono-app .
```

### Run container manually

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  hono-app
```

### Access running container

```bash
# Execute shell in running container
docker-compose exec app sh

# View logs
docker-compose logs -f app
```

### Database migrations

If you're using a migration tool, run migrations:

```bash
docker-compose exec app pnpm run migrate
```

## Troubleshooting

### Port already in use

Change the port mapping in `.env` or `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Use port 3001 on host
```

### Database connection issues

1. Check if PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Verify DATABASE_URL is correct:
   ```bash
   docker-compose exec app printenv DATABASE_URL
   ```

### Reset everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## Production Deployment

For production deployment to cloud platforms:

### Using Docker Compose

```bash
# Set production environment
export NODE_ENV=production

# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Using Container Orchestration

For Kubernetes, AWS ECS, or other platforms:

1. Build and push image to registry:
   ```bash
   docker build -t your-registry/hono-app:latest .
   docker push your-registry/hono-app:latest
   ```

2. Use the image in your orchestration config

## Health Checks

The docker-compose configuration includes health checks for all services:

- **PostgreSQL**: Checks if database accepts connections
- **Redis**: Pings Redis server
- **App**: Depends on healthy database and Redis

## Volumes

Persistent data is stored in Docker volumes:

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files

To backup volumes:

```bash
docker run --rm -v hono-starter_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

