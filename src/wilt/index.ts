// Wilt - NestJS-like framework for Cloudflare Workers with Hono

// Decorators
export * from "./decorators/controller.decorator.js";
export * from "./decorators/validation.decorator.js";
export * from "./decorators/zod-validation.decorator.js";
export * from "./decorators/query-validation.decorator.js";
export * from "./decorators/param.decorator.js";

// Dependency Injection
export * from "./di/module.factory.js";

// Interfaces
export * from "./interfaces/base-response.interface.js";
// Middleware
export * from "./middleware/auth.middleware.js";
export * from "./middleware/index.js";
// Utils


// Auth decorators
export { RequireAuth, RequireRoles, RequireAdmin } from './decorators/auth.decorator.js';
export { authMiddleware, requireAuth, requireRoles } from './middleware/auth.middleware.js';
export type { AuthenticatedUser } from './middleware/auth.middleware.js';
