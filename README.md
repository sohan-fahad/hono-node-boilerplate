# Hono Starter

A production-ready starter template for building APIs with [Hono](https://hono.dev/), featuring dependency injection, decorators, and Docker support.

## Features

✨ **Modern Framework**: Built with Hono for blazing-fast API development  
🎯 **Decorator Support**: NestJS-like decorators for controllers, routes, and validation  
💉 **Dependency Injection**: TSyringe for clean dependency management  
🔒 **Authentication**: JWT-based auth with role-based access control  
✅ **Type Safety**: Full TypeScript support with strict mode  
🗄️ **Database**: Drizzle ORM with PostgreSQL for type-safe queries  
🐳 **Docker Ready**: Complete Docker setup with PostgreSQL and Redis  
📦 **Path Aliases**: Clean imports with `@wilt` and `@src` aliases  
🔐 **Validation**: Zod schema validation decorators  

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Start dev server with hot reload
pnpm dev

# Open browser
open http://localhost:3000
```

## Docker Deployment

See [DOCKER.md](./DOCKER.md) for complete Docker deployment guide.

### Quick Docker Start

```bash
# Start all services (postgres, redis, app)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop services
pnpm docker:down
```

## Project Structure

```
src/
├── index.ts              # Application entry point
├── app.module.ts         # Root module
├── env.ts                # Environment configuration
├── modules/              # Feature modules
│   ├── app/
│   │   └── auth/        # Authentication module
│   └── shared/          # Shared utilities
│       └── helpers/     # Helper services
└── wilt/                # Framework utilities
    ├── decorators/      # Route & validation decorators
    ├── di/              # Dependency injection
    ├── middleware/      # Auth & logging middleware
    ├── interfaces/      # TypeScript interfaces
    └── utils/           # Utility functions
```

## Usage Examples

### Creating a Controller

```typescript
import { Controller, Get, Post, Injectable } from '@wilt';
import type { Context } from 'hono';

@Injectable()
class UserService {
  getUsers() {
    return [{ id: 1, name: 'John' }];
  }
}

@Controller('/users')
class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  async getAll(c: Context) {
    const users = this.userService.getUsers();
    return c.json({ users });
  }

  @Post('/')
  async create(c: Context) {
    const body = await c.req.json();
    return c.json({ created: true, data: body });
  }
}
```

### Using Validation

```typescript
import { ZodValidate } from '@wilt';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18)
});

@Controller('/users')
class UserController {
  @Post('/')
  @ZodValidate(createUserSchema)
  async create(c: Context) {
    // Access validated data
    const validated = c.get('validatedData');
    return c.json({ created: true, data: validated });
  }
}
```

### Authentication

```typescript
import { RequireAuth, RequireRoles } from '@wilt';

@Controller('/admin')
class AdminController {
  @Get('/dashboard')
  @RequireAuth()
  @RequireRoles(['admin'])
  async dashboard(c: Context) {
    const user = c.get('user');
    return c.json({ message: `Welcome ${user.email}` });
  }
}
```

### Creating a Module

```typescript
import { Module } from '@wilt';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [],
  exports: [UserService]
})
export class UserModule {}
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Build
pnpm build            # Build for production

# Production
pnpm start            # Start production server

# Docker
pnpm docker:build     # Build Docker image
pnpm docker:up        # Start all containers
pnpm docker:down      # Stop all containers
pnpm docker:logs      # View application logs
pnpm docker:restart   # Restart app container
pnpm docker:clean     # Stop and remove volumes
```

## Environment Variables

Create a `.env` file from `env.example`:

```bash
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hono_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT (Generate secure secrets for production!)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_RESET_SECRET=your-reset-secret
```

## Path Aliases

Import from anywhere using clean aliases:

```typescript
// Instead of: import { ... } from '../../../wilt/decorators/...'
import { Controller, Get, Post } from '@wilt';

// Instead of: import { ENV } from '../../env'
import { ENV } from '@src/env';
```

## Architecture

### Wilt Framework

This project uses **Wilt**, a NestJS-inspired framework built on top of Hono, providing:

- **Decorators**: `@Controller`, `@Get`, `@Post`, `@Injectable`, etc.
- **Dependency Injection**: Automatic service resolution via TSyringe
- **Validation**: `@ZodValidate` for request validation
- **Auth**: `@RequireAuth`, `@RequireRoles` decorators
- **Response Utils**: Standardized API responses

### Dependency Injection

Services are automatically injected into controllers:

```typescript
@Injectable()
class MyService {
  doSomething() {}
}

@Controller('/api')
class MyController {
  // MyService is automatically injected
  constructor(private myService: MyService) {}
}
```

## Production Deployment

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
NODE_ENV=production pnpm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Resources

- [Hono Documentation](https://hono.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TSyringe](https://github.com/microsoft/tsyringe)
- [Zod](https://zod.dev/)
