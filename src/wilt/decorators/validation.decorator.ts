import type { Context } from "hono";

export interface ValidationRule {
	field: string;
	required?: boolean;
	type?: "string" | "number" | "boolean" | "object" | "array";
	minLength?: number;
	maxLength?: number;
	pattern?: RegExp;
	custom?: (value: any) => boolean;
}

export function Validate(rules: ValidationRule[]) {
	return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (c: Context) {
			const body = await c.req.json().catch(() => ({}));
			const errors: string[] = [];

			for (const rule of rules) {
				const value = body[rule.field];

				// Check if required
				if (rule.required && (value === undefined || value === null || value === "")) {
					errors.push(`${rule.field} is required`);
					continue;
				}

				// Skip validation if value is not present and not required
				if (value === undefined || value === null) {
					continue;
				}

				// Type validation
				if (rule.type) {
					const actualType = Array.isArray(value) ? "array" : typeof value;
					if (actualType !== rule.type) {
						errors.push(`${rule.field} must be of type ${rule.type}`);
					}
				}

				// Length validation for strings
				if (rule.type === "string" || typeof value === "string") {
					if (rule.minLength && value.length < rule.minLength) {
						errors.push(`${rule.field} must be at least ${rule.minLength} characters long`);
					}
					if (rule.maxLength && value.length > rule.maxLength) {
						errors.push(`${rule.field} must be at most ${rule.maxLength} characters long`);
					}
				}

				// Pattern validation
				if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
					errors.push(`${rule.field} format is invalid`);
				}

				// Custom validation
				if (rule.custom && !rule.custom(value)) {
					errors.push(`${rule.field} validation failed`);
				}
			}

			if (errors.length > 0) {
				return c.json(
					{
						success: false,
						error: {
							code: "VALIDATION_ERROR",
							message: "Validation failed",
							details: errors,
						},
						timestamp: new Date().toISOString(),
					},
					400,
				);
			}

			return originalMethod.call(this, c);
		};

		return descriptor;
	};
}
