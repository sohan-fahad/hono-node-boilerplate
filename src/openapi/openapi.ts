export const openApiDoc = {
    openapi: "3.0.0",
    info: {
        title: "Hono Starter API",
        version: "1.0.0",
        description: `
A comprehensive REST API for Hono framework.

## Features
- JWT-based authentication with OTP verification

## Authentication
Most endpoints require authentication using Bearer tokens. Include the JWT token in the Authorization header:
\`Authorization: Bearer <your-jwt-token>\`

## Error Handling
All endpoints follow a consistent error response format with appropriate HTTP status codes.
`,
        contact: {
            name: "API Support",
            email: "contact@sohanfahad.dev"
        },
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT"
        }
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Development server"
        }
    ],
    paths: {
        // Health Endpoints
        "/": {
            get: {
                tags: ["Health"],
                summary: "API Root",
                description: "Returns basic API information and health status",
                operationId: "getRoot",
                responses: {
                    "200": {
                        description: "API is healthy and running",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/HealthResponse" },
                                example: {
                                    success: true,
                                    message: "Health check ",
                                    data: { status: "ok" },
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Health Check",
                description: "Comprehensive health check including database connectivity",
                operationId: "healthCheck",
                responses: {
                    "200": {
                        description: "System is healthy",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/HealthResponse" },
                                example: {
                                    success: true,
                                    message: "Health check passed",
                                    data: { status: "ok" },
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "503": {
                        description: "Service unavailable",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" }
                            }
                        }
                    }
                }
            }
        },

        // Authentication Endpoints
        "/auth/register": {
            post: {
                tags: ["Authentication"],
                summary: "User Registration",
                description: "Register a new user account with email, phone number, and organization details.",
                operationId: "registerUser",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterDto" },
                            example: {
                                name: "John Doe",
                                email: "john@example.com",
                                phoneNumber: "+1234567890",
                                password: "SecurePass123",
                                organization: {
                                    name: "Acme Corporation",
                                    description: "Technology company"
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": {
                        description: "User registered successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SuccessResponse" },
                                example: {
                                    success: true,
                                    data: {
                                        user: {
                                            id: 1,
                                            email: "john@example.com",
                                            name: "John Doe",
                                            role: "user",
                                            isActive: true,
                                            emailVerified: false,
                                            createdAt: "2024-01-15T10:30:00Z",
                                            updatedAt: "2024-01-15T10:30:00Z"
                                        }
                                    },
                                    message: "User registered successfully. Please check your email to verify your account.",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Validation error or user already exists",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
                                example: {
                                    success: false,
                                    error: {
                                        code: "VALIDATION_ERROR",
                                        message: "Validation failed",
                                        details: [
                                            {
                                                field: "email",
                                                message: "Invalid email format",
                                                code: "invalid_string"
                                            }
                                        ]
                                    },
                                    message: "User with this email already exists",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "User Login",
                description: "Authenticate user with email and password. Returns JWT access and refresh tokens.",
                operationId: "loginUser",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginDto" },
                            example: {
                                email: "john@example.com",
                                password: "SecurePass123"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Login successful",
                        content: {
                            "application/json": {
                                schema: {
                                    allOf: [
                                        { $ref: "#/components/schemas/SuccessResponse" },
                                        {
                                            type: "object",
                                            properties: {
                                                data: { $ref: "#/components/schemas/AuthResponse" }
                                            }
                                        }
                                    ]
                                },
                                example: {
                                    success: true,
                                    data: {
                                        user: {
                                            id: 1,
                                            email: "john@example.com",
                                            name: "John Doe",
                                            role: "user",
                                            isActive: true,
                                            emailVerified: false,
                                            createdAt: "2024-01-15T10:30:00Z",
                                            updatedAt: "2024-01-15T10:30:00Z"
                                        },
                                        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    },
                                    message: "Login successful",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "401": {
                        description: "Authentication failed - Invalid credentials or user account deactivated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: {
                                    success: false,
                                    error: {
                                        message: "Invalid email or password"
                                    },
                                    message: "Invalid email or password",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/forgot-password": {
            post: {
                tags: ["Authentication"],
                summary: "Forgot Password",
                description: "Request a password reset token. Token will be sent via email (not implemented yet - returns token directly for testing).",
                operationId: "forgotPassword",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForgotPasswordDto" },
                            example: {
                                email: "john@example.com"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Password reset token generated successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SuccessResponse" },
                                example: {
                                    success: true,
                                    data: {
                                        resetToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    },
                                    message: "Password reset token sent successfully",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid email or user not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" }
                            }
                        }
                    }
                }
            }
        },
        "/auth/reset-password": {
            post: {
                tags: ["Authentication"],
                summary: "Reset Password",
                description: "Reset user password using the reset token from forgot-password endpoint.",
                operationId: "resetPassword",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ResetPasswordDto" },
                            example: {
                                token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                password: "NewSecurePass123"
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Password reset successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/SuccessResponse" },
                                example: {
                                    success: true,
                                    data: {
                                        message: "Password reset successfully"
                                    },
                                    message: "Password reset successfully",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "400": {
                        description: "Invalid or expired token",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: {
                                    success: false,
                                    error: {
                                        message: "Invalid or expired reset token"
                                    },
                                    message: "Invalid or expired reset token",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/refresh": {
            post: {
                tags: ["Authentication"],
                summary: "Refresh Access Token",
                description: "Get a new access token using a valid refresh token.",
                operationId: "refreshToken",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RefreshTokenDto" },
                            example: {
                                refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            }
                        }
                    }
                },
                responses: {
                    "200": {
                        description: "Token refreshed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    allOf: [
                                        { $ref: "#/components/schemas/SuccessResponse" },
                                        {
                                            type: "object",
                                            properties: {
                                                data: { $ref: "#/components/schemas/AuthResponse" }
                                            }
                                        }
                                    ]
                                },
                                example: {
                                    success: true,
                                    data: {
                                        user: {
                                            id: 1,
                                            email: "john@example.com",
                                            name: "John Doe",
                                            role: "user",
                                            isActive: true,
                                            emailVerified: false,
                                            createdAt: "2024-01-15T10:30:00Z",
                                            updatedAt: "2024-01-15T10:30:00Z"
                                        },
                                        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                                        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                                    },
                                    message: "Token refreshed successfully",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    },
                    "401": {
                        description: "Invalid or expired refresh token",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                                example: {
                                    success: false,
                                    error: {
                                        message: "Refresh token has expired"
                                    },
                                    message: "Refresh token has expired",
                                    timestamp: "2024-01-15T10:30:00Z"
                                }
                            }
                        }
                    }
                }
            }
        },


        components: {
            securitySchemes: {
                BearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token obtained from login or OTP verification"
                }
            },
            schemas: {
                // Base Response Schemas
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                            description: "Indicates if the request was successful"
                        },
                        message: {
                            type: "string",
                            description: "Human-readable success message"
                        },
                        data: {
                            type: "object",
                            description: "Response data (structure varies by endpoint)"
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            description: "ISO 8601 timestamp of the response"
                        }
                    },
                    required: ["success", "timestamp"]
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                            description: "Always false for error responses"
                        },
                        error: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    description: "Machine-readable error code"
                                },
                                message: {
                                    type: "string",
                                    description: "Human-readable error message"
                                }
                            },
                            required: ["message"]
                        },
                        message: {
                            type: "string",
                            description: "Human-readable error message"
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            description: "ISO 8601 timestamp of the response"
                        }
                    },
                    required: ["success", "error", "timestamp"]
                },
                ValidationErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false
                        },
                        error: {
                            type: "object",
                            properties: {
                                code: {
                                    type: "string",
                                    example: "VALIDATION_ERROR",
                                    description: "Error code for validation failures"
                                },
                                message: {
                                    type: "string",
                                    example: "Validation failed",
                                    description: "General validation error message"
                                },
                                details: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            field: {
                                                type: "string",
                                                description: "Field name that failed validation"
                                            },
                                            message: {
                                                type: "string",
                                                description: "Specific validation error message"
                                            },
                                            code: {
                                                type: "string",
                                                description: "Validation rule that failed"
                                            }
                                        }
                                    },
                                    description: "Array of specific validation errors"
                                }
                            }
                        },
                        timestamp: { type: "string", format: "date-time" }
                    },
                    required: ["success", "error", "timestamp"]
                },
                HealthResponse: {
                    type: "object",
                    allOf: [
                        { $ref: "#/components/schemas/SuccessResponse" },
                        {
                            type: "object",
                            properties: {
                                data: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "string",
                                            enum: ["healthy", "degraded", "unhealthy"],
                                            description: "Overall system health status"
                                        },
                                        version: {
                                            type: "string",
                                            description: "API version"
                                        },
                                        uptime: {
                                            type: "number",
                                            description: "System uptime in seconds"
                                        },
                                        database: {
                                            type: "object",
                                            properties: {
                                                status: {
                                                    type: "string",
                                                    enum: ["connected", "disconnected"]
                                                },
                                                responseTime: {
                                                    type: "number",
                                                    description: "Database response time in milliseconds"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },

                // Authentication DTOs
                RegisterDto: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            minLength: 2,
                            maxLength: 100,
                            description: "User's full name",
                            example: "John Doe"
                        },
                        email: {
                            type: "string",
                            format: "email",
                            maxLength: 255,
                            description: "User's email address (optional)",
                            example: "john@example.com"
                        },
                        phoneNumber: {
                            type: "string",
                            pattern: "^01[3-9]\\d{8}$",
                            description: "Bangladeshi mobile phone number",
                            example: "01712345678"
                        },
                        password: {
                            type: "string",
                            minLength: 6,
                            maxLength: 100,
                            description: "User password (minimum 6 characters)",
                            example: "securePassword123"
                        },
                        role: {
                            type: "string",
                            enum: ["admin", "customer"],
                            default: "customer",
                            description: "User role in the system"
                        },
                        image: {
                            type: "string",
                            format: "uri",
                            maxLength: 500,
                            description: "Profile image URL (optional)",
                            example: "https://example.com/avatar.jpg"
                        }
                    },
                    required: ["name", "phoneNumber", "password"]
                },
                LoginDto: {
                    type: "object",
                    properties: {
                        phoneNumber: {
                            type: "string",
                            pattern: "^01[3-9]\\d{8}$",
                            description: "Bangladeshi mobile phone number",
                            example: "01712345678"
                        },
                        password: {
                            type: "string",
                            minLength: 1,
                            description: "User password",
                            example: "securePassword123"
                        }
                    },
                    required: ["phoneNumber", "password"]
                }
            }
        },

        tags: [
            {
                name: "Health",
                description: "System health and status endpoints"
            },
            {
                name: "Authentication",
                description: "User authentication, registration, and OTP verification"
            },
        ]
    }
}
