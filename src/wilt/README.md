# Wilt - NestJS-like Framework for Cloudflare Workers

A lightweight, NestJS-inspired framework for building modular APIs with Cloudflare Workers and Hono.

## Features

- **Decorator-based routing** - Use `@Controller`, `@Get`, `@Post`, etc.
- **Dependency Injection** - Powered by tsyringe with NestJS-like syntax
- **Module system** - Organize code into modules with `@Module`
- **Validation** - Built-in request validation with `@Validate`
- **Response utilities** - Standardized API responses

## Structure

```
src/wilt/
├── decorators/
│   ├── controller.decorator.ts  # @Controller, @Get, @Post, etc.
│   └── validation.decorator.ts  # @Validate
├── di/
│   └── module.factory.ts        # Module creation and DI
├── interfaces/
│   └── base-response.interface.ts # Response types
├── utils/
│   └── response.util.ts         # Response utilities
└── index.ts                     # Main exports
```

## Usage

```typescript
import { Module, Controller, Get, Injectable, Inject } from "./wilt";

@Injectable()
export class UserService {
  getUsers() {
    return ["user1", "user2"];
  }
}

@Controller("/api/users")
export class UserController {
  constructor(@Inject(UserService) private userService: UserService) {}

  @Get()
  async getUsers(c: Context) {
    const users = this.userService.getUsers();
    return ResponseUtil.success(c, users);
  }
}

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

## Installation

The wilt package is included in your project. Import directly from the wilt directory:

```typescript
import {
  Module,
  Controller,
  Get,
} from "./wilt/decorators/controller.decorator";
import { createModule } from "./wilt/di/module.factory";
```
