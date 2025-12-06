import type { Context } from "hono";
import { z } from "zod";

export function ZodValidate(schema: z.ZodSchema) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (c: Context) {
			try {
				const contentType = c.req.header("content-type") || "";
				let input: any = {};

				if (contentType.includes("multipart/form-data")) {
					const formData = await c.req.formData();
					// Build plain object from form-data (keep File instances)
					formData.forEach((val, key) => {
						if (val instanceof File) {
							input[key] = val;
						} else {
							input[key] = val;
						}
					});
				} else {
					// Fallback to JSON
					input = await c.req.json().catch(() => ({}));
				}


				const validatedData = schema.parse(input);
				c.set("validatedData", validatedData);
				return originalMethod.call(this, c);
			} catch (error) {
				console.error(error);
				if (error instanceof z.ZodError) {
					const errors = error.issues.map((err) => ({
						field: err.path.join('.'),
						message: err.message,
						code: err.code,
					}));
					return c.json({
						success: false,
						error: { code: "VALIDATION_ERROR", message: "Validation failed", details: errors },
						message: errors[0].message ?? "Validation failed",
						timestamp: new Date().toISOString(),
					}, 400);
				}
				return c.json({
					success: false,
					error: { code: "BAD_REQUEST", message: "Invalid request format", details: [(error as Error)?.message || "Unknown error"] },
					message: "Invalid request format",
					timestamp: new Date().toISOString(),
				}, 400);
			}
		};

		return descriptor;
	};
} 