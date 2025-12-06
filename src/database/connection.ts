import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ENV } from "@src/env.js";
import { logger } from "@wilt/utils/logger.util.js";

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: ENV.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Handle pool errors
pool.on("error", (err) => {
    logger.error(`Unexpected database error: ${err.message}`, "Database");
});

pool.on("connect", (client) => {
    logger.info("Database connection established", "Database");
});

// Create Drizzle instance
export const db = drizzle(pool);

// Test connection function
export async function testConnection(): Promise<boolean> {
    try {
        const client = await pool.connect();
        logger.info("Database connection successful", "Database");
        client.release();
        return true;
    } catch (error) {
        logger.error(
            `Database connection failed: ${(error as Error).message}`,
            "Database"
        );
        return false;
    }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
    try {
        await pool.end();
        logger.info("Database connection closed", "Database");
    } catch (error) {
        logger.error(
            `Error closing database connection: ${(error as Error).message}`,
            "Database"
        );
    }
}

// Export pool for advanced usage
export { pool };

