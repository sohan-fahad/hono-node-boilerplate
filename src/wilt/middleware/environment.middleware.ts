import type { Context, Next } from "hono";
import { container } from "tsyringe";

export async function environmentMiddleware(c: Context, next: Next) {
	// Set environment on services that need it
	try {
		// Set environment on CanvasDurableService
		const canvasDurableService = container.resolve("CanvasDurableService") as any;
		if (canvasDurableService && typeof canvasDurableService.setEnvironment === "function") {
			canvasDurableService.setEnvironment(c.env);
		}
	} catch (error) {
		// Service might not be registered, which is fine
	}

	try {
		// Set environment on SessionDurableService
		const sessionDurableService = container.resolve("SessionDurableService") as any;
		if (sessionDurableService && typeof sessionDurableService.setEnvironment === "function") {
			sessionDurableService.setEnvironment(c.env);
		}
	} catch (error) {
		// Service might not be registered, which is fine
	}

	await next();
}
