import { Hono } from "hono";
import { container } from "tsyringe";
import { registerControllerRoutes } from "../decorators/controller.decorator.js";
import { logger } from "../utils/logger.util.js";

// Type for dependency metadata
interface DependencyMetadata {
	token: string;
	service: any;
}

// Cache for dependency metadata to avoid repeated reflection
const dependencyMetadataCache = new Map<string, DependencyMetadata[]>();

/**
 * Fallback dependency resolution when reflection metadata is not available
 * Uses naming conventions and provider matching
 */
function getFallbackDependencies(
	ControllerClass: any,
	allProviders: any[]
): DependencyMetadata[] {
	const className = ControllerClass.name;
	const dependencies: DependencyMetadata[] = [];

	// Common naming patterns for services
	const servicePatterns = [
		// Remove "Controller" suffix and add "Service" suffix
		className.replace(/Controller$/, "Service"),
		// For controllers like "UserProfileController" -> "UserProfileService"
		className.replace(/Controller$/, "Service"),
		// For controllers like "ChatController" -> "ChatService"
		className.replace(/Controller$/, "Service"),
	];

	// Find matching providers
	allProviders.forEach(ProviderClass => {
		const providerName = ProviderClass.name;
		if (servicePatterns.includes(providerName)) {
			dependencies.push({
				token: providerName,
				service: ProviderClass,
			});
			logger.debug(
				`Found fallback dependency for ${className}: ${providerName}`,
				"ModuleFactory"
			);
		}
	});

	return dependencies;
}

/**
 * Extracts dependency metadata from a controller class using reflection
 * This approach is more scalable and doesn't require hardcoding controller names
 */
function getControllerDependencies(
	ControllerClass: any,
	allProviders: any[]
): DependencyMetadata[] {
	const className = ControllerClass.name;

	// Check cache first
	if (dependencyMetadataCache.has(className)) {
		return dependencyMetadataCache.get(className)!;
	}

	const dependencies: DependencyMetadata[] = [];

	try {
		// Get constructor parameters using reflection
		const constructorParams =
			Reflect.getMetadata("design:paramtypes", ControllerClass) || [];

		if (constructorParams.length > 0) {
			constructorParams.forEach((paramType: any, index: number) => {
				if (paramType && paramType.name) {
					// Convert service type name to expected service name
					// e.g., ChatService -> ChatService, ProductService -> ProductService
					const serviceName = paramType.name;

					dependencies.push({
						token: serviceName,
						service: paramType,
					});

					logger.debug(
						`Found reflection dependency for ${className}: ${serviceName}`,
						"ModuleFactory"
					);
				}
			});
		} else {
			// Fallback to naming convention if no reflection metadata
			logger.debug(
				`No reflection metadata found for ${className}, using fallback`,
				"ModuleFactory"
			);
			const fallbackDeps = getFallbackDependencies(
				ControllerClass,
				allProviders
			);
			dependencies.push(...fallbackDeps);
		}

		// Cache the result
		dependencyMetadataCache.set(className, dependencies);
	} catch (error) {
		logger.warn(
			`Could not extract dependencies for ${className} using reflection: ${error}`,
			"ModuleFactory"
		);

		// Fallback to naming convention
		const fallbackDeps = getFallbackDependencies(ControllerClass, allProviders);
		dependencies.push(...fallbackDeps);

		// Cache the fallback result
		dependencyMetadataCache.set(className, dependencies);
	}

	return dependencies;
}

/**
 * Resolves dependencies for a controller using the dependency metadata
 */
function resolveControllerDependencies(
	ControllerClass: any,
	resolvedProviders: Map<string, any>,
	allProviders: any[]
): any[] {
	const dependencies = getControllerDependencies(ControllerClass, allProviders);
	const resolvedDeps: any[] = [];

	dependencies.forEach(({ token, service }) => {
		// Try to resolve by token first, then by service class
		let resolved =
			resolvedProviders.get(token) || resolvedProviders.get(service);

		if (resolved) {
			resolvedDeps.push(resolved);
			logger.debug(
				`Resolved dependency ${token} for ${ControllerClass.name}`,
				"ModuleFactory"
			);
		} else {
			logger.error(
				`Failed to resolve dependency ${token} for ${ControllerClass.name}`,
				"ModuleFactory"
			);
			// Push undefined to maintain parameter order, but log the error
			resolvedDeps.push(undefined);
		}
	});

	return resolvedDeps;
}

export function createModule(
	moduleClass: any,
	{ middlewares = [] }: { middlewares: any[] }
): Hono<any> {
	const router = new Hono<any>();
	const moduleInstance = new moduleClass();
	const config = moduleInstance.moduleConfig;

	logger.info(`Creating module: ${moduleClass.name}`, "ModuleFactory");

	// Apply global middleware
	middlewares.forEach(middleware => {
		router.use("*", middleware);
	});

	// Collect all controllers and providers
	const allControllers: any[] = [];
	const allProviders: any[] = [];

	// Get controllers and providers from imported modules
	if (config?.imports) {
		config.imports.forEach((ImportedModuleClass: any) => {
			const importedModuleInstance = new ImportedModuleClass();
			const importedConfig = importedModuleInstance.moduleConfig;

			if (importedConfig?.controllers) {
				allControllers.push(...importedConfig.controllers);
			}
			if (importedConfig?.providers) {
				allProviders.push(...importedConfig.providers);
			}
		});
	}

	// Add this module's controllers and providers
	if (config?.controllers) {
		allControllers.push(...config.controllers);
	}
	if (config?.providers) {
		allProviders.push(...config.providers);
	}

	// Register all providers
	allProviders.forEach((ProviderClass: any) => {
		if (!container.isRegistered(ProviderClass)) {
			container.register(ProviderClass, ProviderClass);
			logger.debug(
				`Registered provider: ${ProviderClass.name}`,
				"ModuleFactory"
			);
		}
	});

	// Register all controllers
	allControllers.forEach((ControllerClass: any) => {
		try {
			// Create a map of resolved providers for dependency injection
			const resolvedProviders = new Map();
			allProviders.forEach((ProviderClass: any) => {
				try {
					const provider = container.resolve(ProviderClass);
					resolvedProviders.set(ProviderClass, provider);
					// Also store by name for easier lookup
					resolvedProviders.set(ProviderClass.name, provider);
				} catch (error) {
					logger.warn(
						`Failed to resolve provider ${ProviderClass.name}: ${error}`,
						"ModuleFactory"
					);
				}
			});

			// Use reflection-based dependency resolution
			const dependencies = resolveControllerDependencies(
				ControllerClass,
				resolvedProviders,
				allProviders
			);

			logger.debug(
				`Resolved dependencies for ${ControllerClass.name}: ${dependencies.map(d => d?.constructor?.name || "undefined").join(", ")}`,
				"ModuleFactory"
			);

			// Create controller instance with resolved dependencies
			const controller = new ControllerClass(...dependencies);
			const controllerPrefix =
				(controller.constructor as any).prototype.prefix || "";
			registerControllerRoutes(router, controller, controllerPrefix);
			logger.debug(
				`Registered controller: ${ControllerClass.name} at ${controllerPrefix}`,
				"ModuleFactory"
			);
		} catch (error) {
			logger.error(
				`Failed to create controller ${ControllerClass.name}: ${error}`,
				"ModuleFactory"
			);
			throw error;
		}
	});

	logger.info(
		`Module ${moduleClass.name} created successfully`,
		"ModuleFactory"
	);
	return router;
}
