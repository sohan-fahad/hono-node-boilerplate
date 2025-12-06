import type { Context } from "hono";
import { z } from "zod";

export function QueryValidate(schema: z.ZodSchema) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (c: Context) {
			try {
				// Get query parameters
				const queryParams = c.req.query();

				const validatedData = schema.parse(queryParams);

				c.set('validatedQuery', validatedData);

				return originalMethod.call(this, c);
			} catch (error) {
				if (error instanceof z.ZodError) {
					const errors = error.issues.map((err: z.ZodIssue) => ({
						field: err.path.join('.'),
						message: err.message,
						code: err.code,
					}));

					return c.json(
						{
							success: false,
							error: {
								code: "VALIDATION_ERROR",
								message: "Query validation failed",
								details: errors,
							},
							message: errors[0].message ?? "Validation failed",
							timestamp: new Date().toISOString(),
						},
						400,
					);
				}

				// Handle other errors
				return c.json(
					{
						success: false,
						error: {
							code: "BAD_REQUEST",
							message: "Invalid query parameters",
							details: [(error as Error)?.message || "Unknown error"],
						},
						timestamp: new Date().toISOString(),
					},
					400,
				);
			}
		};

		return descriptor;
	};
} 