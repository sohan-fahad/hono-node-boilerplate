# 🗄️ Database Setup Guide - Drizzle ORM with PostgreSQL

Complete guide for using Drizzle ORM with PostgreSQL in this Hono application.

## 📋 What's Configured

- ✅ **Drizzle ORM** - Type-safe database ORM
- ✅ **PostgreSQL 16** - Production-ready database
- ✅ **Connection Pooling** - Optimized for performance
- ✅ **Docker Integration** - Database runs in container
- ✅ **Migration System** - Schema versioning
- ✅ **Example Schema** - Users table ready to use

## 🚀 Quick Start

### 1. Create `.env` file

```bash
cp env.template .env
```

Your `.env` should contain:
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/hono_db
```

### 2. Start PostgreSQL

```bash
# Start database (and Redis)
pnpm docker:dev

# Or use make
make docker-dev-up
```

Wait for containers to be healthy (~10 seconds).

### 3. Push Schema to Database

```bash
# Push the schema (creates tables)
pnpm db:push

# Or use make
make db-push
```

### 4. Start the Application

```bash
# Development mode with hot reload
pnpm dev
```

You should see:
```
✅ Server is running on http://localhost:3000
📦 Environment: development
🗄️  Database: Connected
```

## 📦 What's Been Created

```
src/database/
├── connection.ts           # Database connection & pool
├── schema/
│   ├── users.schema.ts    # Example users table
│   └── index.ts           # Schema exports
├── migrations/            # Auto-generated migrations
├── index.ts              # Public API
└── README.md             # Detailed documentation

drizzle.config.ts          # Drizzle configuration
```

## 🎯 Using the Database

### Import in Your Code

```typescript
import { db, users, type User, type NewUser } from "@src/database/index.js";
import { eq } from "drizzle-orm";
```

### CRUD Operations

```typescript
// CREATE
const newUser = await db.insert(users).values({
  email: "john@example.com",
  name: "John Doe",
  password: "hashed_password",
  role: "user"
}).returning();

// READ
const allUsers = await db.select().from(users);

// READ ONE
const user = await db.select()
  .from(users)
  .where(eq(users.email, "john@example.com"))
  .limit(1);

// UPDATE
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1));

// DELETE
await db.delete(users).where(eq(users.id, 1));
```

### In a Service

```typescript
import { Injectable } from "@wilt";
import { db, users, type User } from "@src/database/index.js";
import { eq } from "drizzle-orm";

@Injectable()
export class UserService {
  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }

  async create(data: { email: string; name: string; password: string }) {
    const result = await db.insert(users)
      .values(data)
      .returning();
    return result[0];
  }
}
```

### In a Controller

```typescript
import { Controller, Get, Post } from "@wilt";
import { db, users } from "@src/database/index.js";
import type { Context } from "hono";

@Controller("/users")
export class UserController {
  @Get("/")
  async list(c: Context) {
    const allUsers = await db.select().from(users);
    return c.json({ users: allUsers });
  }

  @Post("/")
  async create(c: Context) {
    const body = await c.req.json();
    const user = await db.insert(users).values(body).returning();
    return c.json({ user: user[0] }, 201);
  }
}
```

## 🛠️ Available Commands

### NPM/PNPM Scripts

```bash
# Database
pnpm db:generate    # Generate migrations from schema changes
pnpm db:push        # Push schema directly (development)
pnpm db:migrate     # Run migrations (production)
pnpm db:studio      # Open Drizzle Studio UI

# Docker
pnpm docker:dev     # Start database + redis
pnpm docker:up      # Start all (production mode)
pnpm docker:down    # Stop containers
pnpm docker:clean   # Remove everything + volumes
```

### Makefile

```bash
make db-push        # Push schema changes
make db-generate    # Generate migrations
make db-studio      # Open Drizzle Studio
make docker-dev-up  # Start dev containers
```

## 🎨 Drizzle Studio

Visual database browser:

```bash
pnpm db:studio
```

Opens at `https://local.drizzle.studio` - browse tables, edit data, run queries!

## 📝 Creating New Schemas

### 1. Create Schema File

```typescript
// src/database/schema/posts.schema.ts
import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

### 2. Export in Index

```typescript
// src/database/schema/index.ts
export * from "./users.schema.js";
export * from "./posts.schema.js"; // Add this
```

### 3. Push to Database

```bash
pnpm db:push
```

## 🔄 Migration Workflow

### Development (Fast Iteration)

```bash
# Make schema changes, then:
pnpm db:push
```

### Production (Proper Migrations)

```bash
# 1. Make schema changes in code
# 2. Generate migration SQL
pnpm db:generate

# 3. Review generated SQL in src/database/migrations/
# 4. Apply migrations
pnpm db:migrate
```

## 🔧 Database Connection Details

### Credentials

| Key | Value |
|-----|-------|
| Host (outside Docker) | `localhost` |
| Host (inside Docker) | `postgres` |
| Port | `5432` |
| User | `admin` |
| Password | `admin` |
| Database | `hono_db` |

### Connection Strings

**From host machine (local dev):**
```
postgresql://admin:admin@localhost:5432/hono_db
```

**From Docker container:**
```
postgresql://admin:admin@postgres:5432/hono_db
```

## 🐛 Troubleshooting

### "Connection refused"

Database not running:
```bash
pnpm docker:dev
docker ps | grep postgres
```

### "Database does not exist"

Auto-created by Docker, but if needed:
```bash
docker exec -it hono-postgres-dev psql -U admin -c "CREATE DATABASE hono_db;"
```

### "Password authentication failed"

Check `.env` file:
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/hono_db
```

### Reset Everything

```bash
# Nuclear option - removes all data
pnpm docker:clean
pnpm docker:dev
pnpm db:push
```

### Check Database

```bash
# Connect to PostgreSQL
docker exec -it hono-postgres-dev psql -U admin -d hono_db

# List tables
\dt

# Query users
SELECT * FROM users;

# Exit
\q
```

## 📚 Example: Complete CRUD Service

```typescript
// src/modules/user/user.service.ts
import { Injectable } from "@wilt";
import { db, users, type User, type NewUser } from "@src/database/index.js";
import { eq } from "drizzle-orm";

@Injectable()
export class UserService {
  async findAll(): Promise<User[]> {
    return await db.select().from(users);
  }

  async findById(id: number): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, id));
    return result[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email));
    return result[0];
  }

  async create(data: NewUser): Promise<User> {
    const result = await db.insert(users)
      .values(data)
      .returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }
}
```

## 🎓 Learn More

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Database README](./src/database/README.md) - More detailed guide

## ✅ Checklist

- [ ] Created `.env` file from `env.template`
- [ ] Started PostgreSQL with `pnpm docker:dev`
- [ ] Pushed schema with `pnpm db:push`
- [ ] Started app with `pnpm dev`
- [ ] Verified database connection in logs
- [ ] Explored tables in Drizzle Studio

You're all set! 🚀

