export const ENV = {
    // Application
    PORT: parseInt(process.env.PORT || "3000", 10),
    NODE_ENV: process.env.NODE_ENV || "development",

    // Database
    DATABASE_URL: process.env.DATABASE_URL || "",

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    REDIS_URL: process.env.REDIS_URL || "",

    // JWT
    JWT: {
        secret: process.env.JWT_SECRET || "",
        expiresIn: process.env.JWT_EXPIRATION || "1h",
        refreshSecret: process.env.JWT_REFRESH_SECRET || "",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
        resetSecret: process.env.JWT_RESET_SECRET || "",
        resetExpiresIn: process.env.JWT_RESET_EXPIRATION || "1h",
    }
};