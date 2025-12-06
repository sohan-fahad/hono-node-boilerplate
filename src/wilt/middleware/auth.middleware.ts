import type { Context, Next } from "hono";
import { container } from "tsyringe";
import { getCookie } from "hono/cookie";
import { JwtService } from "@src/modules/shared/helpers/jwt.service.js";


export interface AuthenticatedUser {
	id: string;
	role: string;
	organizationId: string;
	email?: string;
	phoneNumber?: string;
	name?: string;
	isVerified?: boolean;
	isActive?: boolean;
	[key: string]: any;
}

declare module "hono" {
	interface ContextVariableMap {
		user: AuthenticatedUser;
		token: string;
	}
}

export async function authMiddleware(c: Context, next: Next) {
	try {
		// Get Authorization header
		const authHeader = c.req.header("Authorization");


		if (!authHeader) {
			return await next();
		}

		// c.set('workspaceid', workspaceid);

		// Extract token from Bearer
		const jwtService = container.resolve(JwtService);
		const token = jwtService.extractToken(authHeader);


		if (!token) {
			return await next();
		}

		// Verify and decode token
		const decoded = await jwtService.verify(token);


		// Check if token is valid and not expired
		// if (decoded && decoded.exp && !jwtService.isJwtExpired(decoded.exp)) {
		if (decoded && !decoded.code && decoded.exp && !jwtService.isJwtExpired(decoded.exp)) {
			// Token is valid, add user data to context
			// The JWT payload should contain the user data
			const user = decoded.user || decoded;
			const workspaceId = getCookie(c, "x-workspace-id");
			if (workspaceId) {
				user.organizationId = workspaceId;
			}
			c.set('user', user as AuthenticatedUser);
			c.set('token', token);
		}

		await next();
	} catch (error) {
		// Log error but don't block the request for non-protected routes
		console.error("Auth middleware error:", error);
		await next();
	}
}

export function requireAuth(c: Context, next: Next) {
	const user = c.get('user');
	// const workspaceid = c.get('workspaceid');`

	if (!user) {
		return c.json({
			success: false,
			message: "Authentication required",
			error: "UNAUTHORIZED"
		}, 401);
	}

	return next();
}

export function requireRoles(allowedRoles: string[]) {
	return (c: Context, next: Next) => {
		const user = c.get('user');

		if (!user) {
			return c.json({
				success: false,
				message: "Authentication required",
				error: "UNAUTHORIZED"
			}, 401);
		}

		if (!allowedRoles.includes(user.role)) {
			return c.json({
				success: false,
				message: "Insufficient permissions",
				error: "FORBIDDEN"
			}, 403);
		}

		return next();
	};
} 