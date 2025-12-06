import "reflect-metadata";
import type { Context } from "hono";
import { z } from "zod";

// Metadata keys
const BODY_PARAM_KEY = Symbol("body:param");
const BODY_SCHEMA_KEY = Symbol("body:schema");
const QUERY_PARAM_KEY = Symbol("query:param");
const PARAM_KEY = Symbol("route:param");

interface ParamMetadata {
    index: number;
    type: "body" | "query" | "param" | "context";
    propertyKey?: string; // For specific field extraction
    schema?: z.ZodSchema;
}

/**
 * @Body() parameter decorator - NestJS style
 * Extracts and validates request body, injects as method parameter
 * 
 * @example
 * ```typescript
 * @Post("/register")
 * async register(@Body() data: RegisterDTO) {
 *   // data is validated and typed
 *   return { user: data };
 * }
 * 
 * // With validation schema
 * @Post("/login") 
 * async login(@Body(LoginSchema) credentials: LoginDTO) {
 *   // credentials validated against LoginSchema
 * }
 * 
 * // Extract specific field
 * @Post("/update")
 * async update(@Body("email") email: string) {
 *   // Only email field extracted
 * }
 * ```
 */
export function Body(schemaOrField?: z.ZodSchema | string) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams: ParamMetadata[] = Reflect.getOwnMetadata(BODY_PARAM_KEY, target, propertyKey) || [];

        const isSchema = schemaOrField && typeof schemaOrField !== "string";
        const isField = typeof schemaOrField === "string";

        existingParams.push({
            index: parameterIndex,
            type: "body",
            propertyKey: isField ? schemaOrField : undefined,
            schema: isSchema ? schemaOrField : undefined,
        });

        Reflect.defineMetadata(BODY_PARAM_KEY, existingParams, target, propertyKey);

        // Store schema separately if provided
        if (isSchema) {
            Reflect.defineMetadata(BODY_SCHEMA_KEY, schemaOrField, target, propertyKey);
        }
    };
}

/**
 * @Query() parameter decorator
 * Extracts query parameters
 * 
 * @example
 * ```typescript
 * @Get("/search")
 * async search(@Query() query: SearchDTO) {
 *   return { results: query };
 * }
 * 
 * @Get("/page")
 * async page(@Query("page") page: number) {
 *   return { page };
 * }
 * ```
 */
export function Query(field?: string) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams: ParamMetadata[] = Reflect.getOwnMetadata(QUERY_PARAM_KEY, target, propertyKey) || [];

        existingParams.push({
            index: parameterIndex,
            type: "query",
            propertyKey: field,
        });

        Reflect.defineMetadata(QUERY_PARAM_KEY, existingParams, target, propertyKey);
    };
}

/**
 * @Param() parameter decorator
 * Extracts route parameters
 * 
 * @example
 * ```typescript
 * @Get("/:id")
 * async getById(@Param("id") id: string) {
 *   return { id };
 * }
 * ```
 */
export function Param(field: string) {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams: ParamMetadata[] = Reflect.getOwnMetadata(PARAM_KEY, target, propertyKey) || [];

        existingParams.push({
            index: parameterIndex,
            type: "param",
            propertyKey: field,
        });

        Reflect.defineMetadata(PARAM_KEY, existingParams, target, propertyKey);
    };
}

/**
 * @Ctx() parameter decorator
 * Injects Hono Context
 * 
 * @example
 * ```typescript
 * @Get("/info")
 * async getInfo(@Ctx() c: Context) {
 *   return c.json({ info: "data" });
 * }
 * ```
 */
export function Ctx() {
    return function (target: any, propertyKey: string | symbol, parameterIndex: number) {
        const existingParams: ParamMetadata[] = Reflect.getOwnMetadata("ctx:param", target, propertyKey) || [];

        existingParams.push({
            index: parameterIndex,
            type: "context",
        });

        Reflect.defineMetadata("ctx:param", existingParams, target, propertyKey);
    };
}

/**
 * Method decorator wrapper that processes parameter decorators
 * This should be applied by route decorators (@Get, @Post, etc.)
 */
export function processParams(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
) {
    const originalMethod = descriptor.value;

    // Get all parameter metadata
    const bodyParams: ParamMetadata[] = Reflect.getOwnMetadata(BODY_PARAM_KEY, target, propertyKey) || [];
    const queryParams: ParamMetadata[] = Reflect.getOwnMetadata(QUERY_PARAM_KEY, target, propertyKey) || [];
    const routeParams: ParamMetadata[] = Reflect.getOwnMetadata(PARAM_KEY, target, propertyKey) || [];
    const ctxParams: ParamMetadata[] = Reflect.getOwnMetadata("ctx:param", target, propertyKey) || [];
    const bodySchema: z.ZodSchema | undefined = Reflect.getOwnMetadata(BODY_SCHEMA_KEY, target, propertyKey);

    // Get parameter count
    const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];
    const paramCount = paramTypes.length;

    if (bodyParams.length === 0 && queryParams.length === 0 && routeParams.length === 0 && ctxParams.length === 0) {
        // No parameter decorators, keep original behavior (Context as first param)
        return descriptor;
    }

    descriptor.value = async function (c: Context) {
        try {
            // Prepare arguments array
            const args: any[] = new Array(paramCount);

            // Process body parameters
            if (bodyParams.length > 0) {
                const contentType = c.req.header("content-type") || "";
                let bodyData: any = {};

                // Extract body based on content type
                if (contentType.includes("multipart/form-data")) {
                    const formData = await c.req.formData();
                    formData.forEach((val, key) => {
                        bodyData[key] = val;
                    });
                } else if (contentType.includes("application/x-www-form-urlencoded")) {
                    const formData = await c.req.formData();
                    formData.forEach((val, key) => {
                        bodyData[key] = val;
                    });
                } else {
                    bodyData = await c.req.json().catch(() => ({}));
                }

                // Validate with schema if provided
                let validatedBody = bodyData;
                if (bodySchema) {
                    try {
                        validatedBody = bodySchema.parse(bodyData);
                    } catch (error) {
                        if (error instanceof z.ZodError) {
                            const errors = error.issues.map((err) => ({
                                field: err.path.join("."),
                                message: err.message,
                                code: err.code,
                            }));

                            return c.json(
                                {
                                    success: false,
                                    error: {
                                        code: "VALIDATION_ERROR",
                                        message: "Validation failed",
                                        details: errors,
                                    },
                                    message: errors[0]?.message ?? "Validation failed",
                                    timestamp: new Date().toISOString(),
                                },
                                400
                            );
                        }
                        throw error;
                    }
                }

                // Inject body data into parameters
                for (const param of bodyParams) {
                    if (param.propertyKey) {
                        // Specific field requested
                        args[param.index] = validatedBody[param.propertyKey];
                    } else if (param.schema) {
                        // Schema validation was done above
                        args[param.index] = validatedBody;
                    } else {
                        // Whole body
                        args[param.index] = validatedBody;
                    }
                }

                // Store in context for backward compatibility
                c.set("body", validatedBody);
                c.set("validatedData", validatedBody);
            }

            // Process query parameters
            for (const param of queryParams) {
                const query = c.req.query();
                if (param.propertyKey) {
                    args[param.index] = query[param.propertyKey];
                } else {
                    args[param.index] = query;
                }
            }

            // Process route parameters
            for (const param of routeParams) {
                if (param.propertyKey) {
                    args[param.index] = c.req.param(param.propertyKey);
                }
            }

            // Process context parameters
            for (const param of ctxParams) {
                args[param.index] = c;
            }

            // Call original method with injected parameters
            return await originalMethod.apply(this, args);
        } catch (error) {
            return c.json(
                {
                    success: false,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Failed to process request",
                        details: [(error as Error)?.message || "Unknown error"],
                    },
                    message: "Failed to process request",
                    timestamp: new Date().toISOString(),
                },
                500
            );
        }
    };

    return descriptor;
}

// Export metadata keys for use in route decorators
export { BODY_PARAM_KEY, QUERY_PARAM_KEY, PARAM_KEY, BODY_SCHEMA_KEY };

