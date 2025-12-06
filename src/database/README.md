# Database Configuration

This folder contains the Drizzle ORM configuration for PostgreSQL.

## Structure

```
database/
├── connection.ts       # Database connection setup
├── schema/            # Database schemas
│   ├── users.schema.ts
│   └── index.ts
├── migrations/        # Auto-generated migrations
└── index.ts          # Public exports
```

## Quick Start

### 1. Setup Environment

Copy `env.template` to `.env` and configure:

```bash
cp env.template .env
```

Update the `DATABASE_URL`:
```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/hono_db
```

### 2. Start PostgreSQL (Docker)

```bash
# Start just the database
pnpm docker:dev

# Or start everything
pnpm docker:up
```

### 3. Generate and Run Migrations

```bash
# Generate migration from schema changes
pnpm db:generate

# Push changes to database (for development)
pnpm db:push

# Or apply migrations (for production)
pnpm db:migrate
```

### 4. Open Drizzle Studio

```bash
# Visual database browser
pnpm db:studio
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate migrations from schema |
| `pnpm db:push` | Push schema directly to DB (dev) |
| `pnpm db:migrate` | Run pending migrations (prod) |
| `pnpm db:studio` | Open Drizzle Studio UI |

## Creating Schemas

Create a new schema file in `schema/` folder:

```typescript
// schema/posts.schema.ts
import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users.schema.js";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
```

Then export it in `schema/index.ts`:

```typescript
export * from "./users.schema.js";
export * from "./posts.schema.js";
```

## Using the Database

### Import the database instance

```typescript
import { db, users } from "@src/database/index.js";
import { eq } from "drizzle-orm";

// Query
const allUsers = await db.select().from(users);

// Insert
const newUser = await db.insert(users).values({
  email: "user@example.com",
  name: "John Doe",
  password: "hashed_password",
}).returning();

// Update
await db.update(users)
  .set({ name: "Jane Doe" })
  .where(eq(users.id, 1));

// Delete
await db.delete(users).where(eq(users.id, 1));
```

### In a Service (with Dependency Injection)

```typescript
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

  async create(data: NewUser): Promise<User> {
    const result = await db.insert(users)
      .values(data)
      .returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
```

## Connection Management

The database connection is automatically managed with a connection pool.

### Test Connection

```typescript
import { testConnection } from "@src/database/index.js";

const isConnected = await testConnection();
```

### Close Connection (Graceful Shutdown)

```typescript
import { closeConnection } from "@src/database/index.js";

// On app shutdown
await closeConnection();
```

## Migration Workflow

### Development

Use `db:push` for rapid development:

```bash
# Make schema changes, then push directly
pnpm db:push
```

### Production

Use proper migrations:

```bash
# 1. Make schema changes
# 2. Generate migration
pnpm db:generate

# 3. Review the generated SQL in src/database/migrations/

# 4. Apply migration
pnpm db:migrate
```

## Docker Configuration

The `docker-compose.yml` and `docker-compose.dev.yml` files include PostgreSQL with these defaults:

- **Host**: `localhost` (from host), `postgres` (from containers)
- **Port**: `5432`
- **User**: `admin`
- **Password**: `admin`
- **Database**: `hono_db`

### Connecting from Outside Docker

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/hono_db
```

### Connecting from Inside Docker (containers)

```env
DATABASE_URL=postgresql://admin:admin@postgres:5432/hono_db
```

## Troubleshooting

### "Connection refused"

Make sure PostgreSQL is running:
```bash
pnpm docker:dev
docker ps | grep postgres
```

### "Database does not exist"

The database is auto-created by Docker, but if needed:
```bash
docker exec -it hono-postgres-dev psql -U admin -c "CREATE DATABASE hono_db;"
```

### "Password authentication failed"

Check your `.env` file matches the docker-compose credentials:
- User: `admin`
- Password: `admin`

### Reset Database

```bash
# Stop and remove volumes
pnpm docker:clean

# Restart
pnpm docker:dev

# Reapply migrations
pnpm db:push
```

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit CLI](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

