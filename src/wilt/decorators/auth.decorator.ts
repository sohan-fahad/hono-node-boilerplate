import { requireAuth, requireRoles } from "../index.js";

// Store auth requirements for routes
const authRequirements = new Map<string, { requireAuth?: boolean; roles?: string[] }>();

/**
 * Decorator to require authentication for a route
 * Usage: @RequireAuth
 */
export function RequireAuth(target: any, propertyName: string, descriptor: PropertyDescriptor) {
	const className = target.constructor.name;
	const key = `${className}:${propertyName}`;

	const existing = authRequirements.get(key) || {};
	authRequirements.set(key, { ...existing, requireAuth: true });

	// Store the middleware requirement on the method
	if (!descriptor.value.middlewares) {
		descriptor.value.middlewares = [];
	}
	descriptor.value.middlewares.push(requireAuth);

	return descriptor;
}

/**
 * Decorator to require specific roles for a route
 * Usage: @RequireRoles(['admin', 'user'])
 */
export function RequireRoles(roles: string[]) {
	return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
		const className = target.constructor.name;
		const key = `${className}:${propertyName}`;

		const existing = authRequirements.get(key) || {};
		authRequirements.set(key, { ...existing, roles, requireAuth: true });

		// Store the middleware requirement on the method
		if (!descriptor.value.middlewares) {
			descriptor.value.middlewares = [];
		}
		descriptor.value.middlewares.push(requireRoles(roles));

		return descriptor;
	};
}

/**
 * Decorator to require admin role for a route
 * Usage: @RequireAdmin
 */
export function RequireAdmin(target: any, propertyName: string, descriptor: PropertyDescriptor) {
	return RequireRoles(['admin'])(target, propertyName, descriptor);
}

/**
 * Get auth requirements for a method
 */
export function getAuthRequirements(className: string, methodName: string) {
	return authRequirements.get(`${className}:${methodName}`);
} 