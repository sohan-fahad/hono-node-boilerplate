import type { Config } from "drizzle-kit";

export default {
	schema: "./src/database/schema/*.schema.ts",
	out: "./src/database/migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "postgresql://admin:admin@localhost:5432/hono_db",
	},
} satisfies Config;

