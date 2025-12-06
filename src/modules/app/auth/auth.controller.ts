import { Controller, Post, Body, Inject } from "@wilt";
import {
    type RegisterDto,
    type LoginDto,
    type ForgotPasswordDto,
    type ResetPasswordDto,
    type RefreshTokenDto,
    RegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    RefreshTokenSchema,
} from "./auth.dto.js";
import { AuthService } from "./auth.service.js";
import { SuccessResponse } from "@src/wilt/utils/successResponse.type.js";
import { ErrorResponse } from "@src/wilt/utils/errorResponse.type.js";

@Controller("/auth")
export class AuthController {
    constructor(
        @Inject(AuthService) private readonly authService: AuthService
    ) { }

    /**
     * Register a new user (NestJS-style with @Body decorator)
     * POST /auth/register
     */
    @Post("/register")
    async register(@Body(RegisterSchema) data: RegisterDto) {
        try {
            const result = await this.authService.register(data);

            return new SuccessResponse(
                "User registered successfully. Please check your email to verify your account.",
                result,
                201
            );
        } catch (error: any) {
            return new ErrorResponse({
                message: error.message || "Registration failed",
                statusCode: 400
            });
        }
    }

    /**
     * Login user (NestJS-style with @Body decorator)
     * POST /auth/login
     */
    @Post("/login")
    async login(@Body(LoginSchema) credentials: LoginDto) {
        try {
            const result = await this.authService.login(credentials);

            return new SuccessResponse(
                "Login successful",
                result,
                200
            );
        } catch (error: any) {
            return new ErrorResponse({
                message: error.message || "Login failed",
                statusCode: 401
            });
        }
    }


    /**
     * Forgot password - Generate reset token (NestJS-style)
     * POST /auth/forgot-password
     */
    @Post("/forgot-password")
    async forgotPassword(@Body(ForgotPasswordSchema) data: ForgotPasswordDto) {
        try {
            const result = await this.authService.forgotPassword(data);

            return new SuccessResponse(
                "Password reset token sent successfully",
                { resetToken: result.resetToken },
                200
            );
        } catch (error: any) {
            return new ErrorResponse({
                message: error.message || "Failed to process request",
                statusCode: 400
            });
        }
    }

    /**
     * Reset password with token (NestJS-style)
     * POST /auth/reset-password
     */
    @Post("/reset-password")
    async resetPassword(@Body(ResetPasswordSchema) data: ResetPasswordDto) {
        try {
            const result = await this.authService.resetPassword(data);

            return new SuccessResponse(
                "Password reset successfully",
                result,
                200
            );
        } catch (error: any) {
            return new ErrorResponse({
                message: error.message || "Password reset failed",
                statusCode: 400
            });
        }
    }

    /**
     * Refresh access token (NestJS-style)
     * POST /auth/refresh
     */
    @Post("/refresh")
    async refreshToken(@Body(RefreshTokenSchema) data: RefreshTokenDto) {
        try {
            const result = await this.authService.refreshToken(data);

            return new SuccessResponse(
                "Token refreshed successfully",
                result,
                200
            );
        } catch (error: any) {
            return new ErrorResponse({
                message: error.message || "Token refresh failed",
                statusCode: 401
            });
        }
    }
}
