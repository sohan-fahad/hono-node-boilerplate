import type { Context, Next } from "hono";

export async function errorHandler(c: Context, next: Next) {
	try {
		await next();
	} catch (error) {
		console.error("Unhandled error:", error);

		const status = error instanceof Error && (error as any).status ? (error as any).status : 500;
		const message = error instanceof Error ? error.message : "Internal server error";

		return c.json(
			{
				success: false,
				error: {
					code: "INTERNAL_ERROR",
					message,
					// In Cloudflare Workers, we might not want to expose stack traces
					// stack: error instanceof Error ? error.stack : undefined
				},
				timestamp: new Date().toISOString(),
			},
			status,
		);
	}
}
