import type { Hono } from "hono";
import { injectable, inject as tsyringeInject } from "tsyringe";
import { processParams } from "./param.decorator.js";

export interface RouteMetadata {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	path: string;
	handler: string;
}

export interface ModuleMetadata {
	imports?: any[];
	controllers?: any[];
	providers?: any[];
	exports?: any[];
}

export function Module(config: ModuleMetadata) {
	return (target: any) => {
		target.prototype.moduleConfig = config;

		// Automatically make all providers injectable
		if (config.providers) {
			config.providers.forEach((ProviderClass: any) => {
				if (ProviderClass && typeof ProviderClass === "function") {
					injectable()(ProviderClass);
				}
			});
		}
	};
}

export function Controller(prefix: string = "") {
	return (target: any) => {
		// Apply @injectable() automatically
		injectable()(target);

		// Set the prefix
		target.prototype.prefix = prefix;

		// Store constructor parameters for later injection
		// This avoids reflection metadata issues in Cloudflare Workers
		target.prototype.constructorParams =
			target.prototype.constructorParams || [];

		// Store the constructor for dependency injection
		target.prototype.constructorClass = target;
	};
}

// NestJS-like @Injectable decorator
export function Injectable() {
	return (target: any) => {
		injectable()(target);
	};
}

// NestJS-like @Inject decorator
export function Inject(token?: any) {
	return (
		target: any,
		propertyKey: string | symbol | undefined,
		parameterIndex: number
	) => {
		// If no token provided, use TypeScript reflection metadata
		if (!token) {
			// Try to get parameter type from reflection metadata
			const paramTypes = Reflect.getMetadata("design:paramtypes", target) || [];
			const paramType = paramTypes[parameterIndex];
			if (paramType) {
				return tsyringeInject(paramType)(target, propertyKey, parameterIndex);
			}
		}

		// Use provided token or fallback to tsyringe inject
		return tsyringeInject(token)(target, propertyKey, parameterIndex);
	};
}

// Method decorator factory
function createMethodDecorator(
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
) {
	return (path: string = "") =>
		(target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
			// Ensure routes array exists
			if (!target.constructor.prototype.routes) {
				target.constructor.prototype.routes = [];
			}

			// Add route metadata
			target.constructor.prototype.routes.push({
				method,
				path,
				handler: propertyKey,
			});

			// Process parameter decorators (@Body, @Query, @Param, @Ctx)
			processParams(target, propertyKey, descriptor);

			return descriptor;
		};
}

export const Get = createMethodDecorator("GET");
export const Post = createMethodDecorator("POST");
export const Put = createMethodDecorator("PUT");
export const Delete = createMethodDecorator("DELETE");

// Helper function to register all routes from a controller
export function registerControllerRoutes(
	router: Hono<{ Bindings: any }>,
	controller: any,
	prefix: string = ""
) {
	const routes = (controller.constructor as any).prototype.routes || [];

	routes.forEach((route: RouteMetadata) => {
		const handler = controller[route.handler as keyof typeof controller] as (
			c: any
		) => Promise<Response>;
		const fullPath = prefix + route.path;

		// Check if the handler has middleware attached from decorators
		const methodMiddlewares = (handler as any).middlewares || [];

		// Create the final handler that applies middleware first, then the actual handler
		const finalHandler = methodMiddlewares.length > 0
			? async (c: any) => {
				// Apply each middleware in sequence
				let index = 0;

				const next = async (): Promise<Response | void> => {
					if (index < methodMiddlewares.length) {
						const middleware = methodMiddlewares[index++];
						return await middleware(c, next);
					} else {
						// All middleware passed, call the actual handler
						return await handler.call(controller, c);
					}
				};

				return await next() as Response;
			}
			: handler.bind(controller);

		switch (route.method) {
			case "GET":
				router.get(fullPath, finalHandler);
				break;
			case "POST":
				router.post(fullPath, finalHandler);
				break;
			case "PUT":
				router.put(fullPath, finalHandler);
				break;
			case "DELETE":
				router.delete(fullPath, finalHandler);
				break;
		}
	});
}
