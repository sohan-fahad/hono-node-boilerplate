# Parameter Decorators Guide (NestJS-Style) 🎯

Complete guide to using NestJS-style parameter decorators in your Hono application.

## ✨ Available Parameter Decorators

- `@Body(schema?)` - Extract and validate request body
- `@Query(field?)` - Extract query parameters
- `@Param(field)` - Extract route parameters
- `@Ctx()` - Inject Hono Context

## 🚀 Quick Start

### Before (Old Way)

```typescript
@Post("/register")
@ZodValidate(RegisterSchema)
async register(c: Context): Promise<Response> {
  const data = c.get("validatedData") as RegisterDto;
  // ... use data
}
```

### After (NestJS-Style) ✅

```typescript
@Post("/register")
async register(@Body(RegisterSchema) data: RegisterDto, @Ctx() c: Context): Promise<Response> {
  // data is already validated and typed!
  // ... use data directly
}
```

## 📖 @Body() Decorator

Extract and validate request body with Zod schema.

### Basic Usage

```typescript
import { Controller, Post, Body, Ctx } from "@wilt";
import { z } from "zod";
import type { Context } from "hono";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
});

type CreateUserDto = z.infer<typeof createUserSchema>;

@Controller("/users")
export class UserController {
  @Post("/")
  async create(
    @Body(createUserSchema) userData: CreateUserDto,
    @Ctx() c: Context
  ): Promise<Response> {
    // userData is validated and typed
    console.log(userData.name, userData.email, userData.age);
    
    return c.json({
      success: true,
      data: { user: userData }
    });
  }
}
```

### Without Schema (No Validation)

```typescript
@Post("/raw")
async createRaw(
  @Body() rawData: any,
  @Ctx() c: Context
): Promise<Response> {
  // rawData is not validated
  return c.json({ received: rawData });
}
```

### Extract Specific Field

```typescript
@Post("/update-email")
async updateEmail(
  @Body("email") email: string,
  @Ctx() c: Context
): Promise<Response> {
  // Only email field is extracted
  return c.json({ email });
}
```

## 🔍 @Query() Decorator

Extract query parameters from the URL.

### Full Query Object

```typescript
@Get("/search")
async search(
  @Query() query: any,
  @Ctx() c: Context
): Promise<Response> {
  // query contains all query params
  // Example: /search?q=test&limit=10
  // query = { q: "test", limit: "10" }
  
  return c.json({ query });
}
```

### Specific Query Field

```typescript
@Get("/page")
async getPage(
  @Query("page") page: string,
  @Query("limit") limit: string,
  @Ctx() c: Context
): Promise<Response> {
  // Extract specific query parameters
  // Example: /page?page=1&limit=10
  
  return c.json({
    page: parseInt(page || "1"),
    limit: parseInt(limit || "10")
  });
}
```

### With Validation (Coming Soon)

```typescript
// You can still use QueryValidate decorator for now
@Get("/search")
@QueryValidate(searchSchema)
async search(@Ctx() c: Context): Promise<Response> {
  const query = c.get("validatedQuery");
  return c.json({ results: query });
}
```

## 🎯 @Param() Decorator

Extract route parameters.

```typescript
@Controller("/users")
export class UserController {
  @Get("/:id")
  async getById(
    @Param("id") id: string,
    @Ctx() c: Context
  ): Promise<Response> {
    // id is extracted from route
    // Example: /users/123 -> id = "123"
    
    return c.json({ userId: id });
  }
  
  @Get("/:userId/posts/:postId")
  async getUserPost(
    @Param("userId") userId: string,
    @Param("postId") postId: string,
    @Ctx() c: Context
  ): Promise<Response> {
    // Multiple route params
    return c.json({ userId, postId });
  }
}
```

## 🌐 @Ctx() Decorator

Inject Hono Context when you need it.

```typescript
@Post("/complex")
async complexOperation(
  @Body(dataSchema) data: DataDto,
  @Param("id") id: string,
  @Query("action") action: string,
  @Ctx() c: Context
): Promise<Response> {
  // All parameters injected cleanly
  // c is the Hono context for response handling
  
  return c.json({
    id,
    action,
    data,
    timestamp: new Date()
  });
}
```

## 🎨 Real-World Examples

### Authentication Controller

```typescript
import { Controller, Post, Body, Ctx, Inject } from "@wilt";
import type { Context } from "hono";
import { RegisterSchema, LoginSchema } from "./auth.dto.js";
import type { RegisterDto, LoginDto } from "./auth.dto.js";
import { AuthService } from "./auth.service.js";

@Controller("/auth")
export class AuthController {
  constructor(
    @Inject(AuthService) private authService: AuthService
  ) {}
  
  @Post("/register")
  async register(
    @Body(RegisterSchema) data: RegisterDto,
    @Ctx() c: Context
  ): Promise<Response> {
    const result = await this.authService.register(data);
    
    return c.json({
      success: true,
      data: result,
      message: "User registered successfully"
    }, 201);
  }
  
  @Post("/login")
  async login(
    @Body(LoginSchema) credentials: LoginDto,
    @Ctx() c: Context
  ): Promise<Response> {
    const result = await this.authService.login(credentials);
    
    return c.json({
      success: true,
      data: result,
      message: "Login successful"
    });
  }
}
```

### User CRUD Controller

```typescript
@Controller("/users")
export class UserController {
  constructor(
    @Inject(UserService) private userService: UserService
  ) {}
  
  // Create user
  @Post("/")
  async create(
    @Body(createUserSchema) userData: CreateUserDto,
    @Ctx() c: Context
  ): Promise<Response> {
    const user = await this.userService.create(userData);
    return c.json({ success: true, data: { user } }, 201);
  }
  
  // Get user by ID
  @Get("/:id")
  async getById(
    @Param("id") id: string,
    @Ctx() c: Context
  ): Promise<Response> {
    const user = await this.userService.findById(parseInt(id));
    return c.json({ success: true, data: { user } });
  }
  
  // Update user
  @Put("/:id")
  async update(
    @Param("id") id: string,
    @Body(updateUserSchema) userData: UpdateUserDto,
    @Ctx() c: Context
  ): Promise<Response> {
    const user = await this.userService.update(parseInt(id), userData);
    return c.json({ success: true, data: { user } });
  }
  
  // List users with pagination
  @Get("/")
  async list(
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Ctx() c: Context
  ): Promise<Response> {
    const users = await this.userService.findAll({
      page: parseInt(page || "1"),
      limit: parseInt(limit || "10")
    });
    
    return c.json({ success: true, data: { users } });
  }
  
  // Delete user
  @Delete("/:id")
  async delete(
    @Param("id") id: string,
    @Ctx() c: Context
  ): Promise<Response> {
    await this.userService.delete(parseInt(id));
    return c.json({ success: true, message: "User deleted" });
  }
}
```

### Blog Post Controller

```typescript
const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
});

type CreatePostDto = z.infer<typeof createPostSchema>;

@Controller("/posts")
export class PostController {
  @Post("/")
  async create(
    @Body(createPostSchema) postData: CreatePostDto,
    @Ctx() c: Context
  ): Promise<Response> {
    // Get authenticated user from context (set by auth middleware)
    const user = c.get("user");
    
    const post = await this.postService.create({
      ...postData,
      authorId: user.id
    });
    
    return c.json({
      success: true,
      data: { post }
    }, 201);
  }
  
  @Get("/search")
  async search(
    @Query("q") searchQuery: string,
    @Query("tag") tag: string,
    @Query("page") page: string,
    @Ctx() c: Context
  ): Promise<Response> {
    const posts = await this.postService.search({
      query: searchQuery,
      tag,
      page: parseInt(page || "1")
    });
    
    return c.json({
      success: true,
      data: { posts }
    });
  }
  
  @Get("/:slug")
  async getBySlug(
    @Param("slug") slug: string,
    @Ctx() c: Context
  ): Promise<Response> {
    const post = await this.postService.findBySlug(slug);
    
    if (!post) {
      return c.json({
        success: false,
        message: "Post not found"
      }, 404);
    }
    
    return c.json({
      success: true,
      data: { post }
    });
  }
}
```

## 🔥 Advanced Patterns

### Combining Multiple Decorators

```typescript
@Post("/:userId/profile")
async updateProfile(
  @Param("userId") userId: string,
  @Body(profileSchema) profileData: ProfileDto,
  @Query("notify") notify: string,
  @Ctx() c: Context
): Promise<Response> {
  const shouldNotify = notify === "true";
  
  const profile = await this.userService.updateProfile(
    parseInt(userId),
    profileData,
    shouldNotify
  );
  
  return c.json({ success: true, data: { profile } });
}
```

### With Authentication

```typescript
import { RequireAuth } from "@wilt";

@Controller("/profile")
export class ProfileController {
  @Get("/me")
  @RequireAuth()  // Auth decorator still works!
  async getCurrentUser(@Ctx() c: Context): Promise<Response> {
    const user = c.get("user"); // Set by @RequireAuth
    return c.json({ success: true, data: { user } });
  }
  
  @Put("/me")
  @RequireAuth()
  async updateProfile(
    @Body(updateProfileSchema) profileData: UpdateProfileDto,
    @Ctx() c: Context
  ): Promise<Response> {
    const user = c.get("user");
    const updated = await this.profileService.update(user.id, profileData);
    
    return c.json({
      success: true,
      data: { profile: updated }
    });
  }
}
```

### Error Handling

```typescript
@Post("/process")
async process(
  @Body(processSchema) data: ProcessDto,
  @Ctx() c: Context
): Promise<Response> {
  try {
    const result = await this.service.process(data);
    return c.json({ success: true, data: result });
  } catch (error) {
    // Custom error handling
    return c.json({
      success: false,
      error: {
        message: error.message,
        code: "PROCESS_ERROR"
      }
    }, 500);
  }
}
```

## ✅ Validation Error Response

When validation fails with `@Body(schema)`, you get:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "too_small"
      }
    ]
  },
  "message": "Invalid email format",
  "timestamp": "2025-12-06T14:00:00.000Z"
}
```

## 🎯 Best Practices

### 1. Always Use Type Inference

```typescript
// ✅ Good - Type safe
type CreateUserDto = z.infer<typeof createUserSchema>;

@Post("/")
async create(@Body(createUserSchema) data: CreateUserDto) {
  // TypeScript knows the shape of data
}

// ❌ Avoid - No type safety
@Post("/")
async create(@Body(createUserSchema) data: any) {
  // No IDE autocomplete or type checking
}
```

### 2. Inject Context When Needed

```typescript
// ✅ Good - Only inject what you need
@Post("/simple")
async simple(@Body(schema) data: Dto, @Ctx() c: Context) {
  return c.json({ data });
}

// ❌ Less ideal - Unnecessary context if you don't use it
@Post("/simple")
async simple(@Body(schema) data: Dto) {
  // Can't return response without context!
}
```

### 3. Order Parameters Logically

```typescript
// ✅ Good - Logical order: params, body, query, context
@Put("/:id")
async update(
  @Param("id") id: string,
  @Body(schema) data: Dto,
  @Query("action") action: string,
  @Ctx() c: Context
) {
  // Easy to read and understand
}
```

### 4. Validate All Input

```typescript
// ✅ Good - Schema validation
@Post("/users")
async create(@Body(createUserSchema) data: CreateUserDto) {
  // data is validated
}

// ❌ Risky - No validation
@Post("/users")
async create(@Body() data: any) {
  // Unvalidated user input!
}
```

## 🆚 Comparison with Other Styles

### Old Way (Method Decorator + Context)

```typescript
@Post("/register")
@ZodValidate(RegisterSchema)
async register(c: Context): Promise<Response> {
  const data = c.get("validatedData") as RegisterDto;
  const result = await this.service.register(data);
  return c.json({ success: true, data: result });
}
```

### New Way (Parameter Decorators) ⭐

```typescript
@Post("/register")
async register(
  @Body(RegisterSchema) data: RegisterDto,
  @Ctx() c: Context
): Promise<Response> {
  const result = await this.service.register(data);
  return c.json({ success: true, data: result });
}
```

**Benefits:**
- ✅ Cleaner, more readable code
- ✅ Direct parameter injection (NestJS-style)
- ✅ Less boilerplate
- ✅ Better IDE support
- ✅ Explicit parameter types

## 🚦 Migration Guide

### Step 1: Import Parameter Decorators

```typescript
// Old
import { Controller, Post, ZodValidate } from "@wilt";

// New
import { Controller, Post, Body, Ctx, Param, Query } from "@wilt";
```

### Step 2: Update Method Signatures

```typescript
// Old
@Post("/users")
@ZodValidate(createUserSchema)
async create(c: Context): Promise<Response> {
  const data = c.get("validatedData") as CreateUserDto;
  // ...
}

// New
@Post("/users")
async create(
  @Body(createUserSchema) data: CreateUserDto,
  @Ctx() c: Context
): Promise<Response> {
  // data is already available
  // ...
}
```

### Step 3: Remove Old Decorators

```typescript
// Remove @ZodValidate, @QueryValidate if using parameter decorators
// The schema is now part of @Body()
```

## 📚 Reference

### All Parameter Decorators

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@Body(schema?)` | Extract & validate body | `@Body(schema) data: Dto` |
| `@Query(field?)` | Extract query params | `@Query("page") page: string` |
| `@Param(field)` | Extract route params | `@Param("id") id: string` |
| `@Ctx()` | Inject Hono Context | `@Ctx() c: Context` |

### Content Types Supported

- `application/json` ✅
- `multipart/form-data` ✅
- `application/x-www-form-urlencoded` ✅

---

Happy coding with NestJS-style decorators! 🎉

