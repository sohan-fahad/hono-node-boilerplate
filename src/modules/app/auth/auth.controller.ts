import { Controller, Post, Get, ZodValidate, ResponseUtil, Inject } from "@wilt";
import type { Context } from "hono";
import {
    type RegisterDto,
    type LoginDto,
    type ForgotPasswordDto,
    type ResetPasswordDto,
    type RefreshTokenDto,
    type ChangePasswordDto,
    RegisterSchema,
    LoginSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema,
    RefreshTokenSchema,
    ChangePasswordSchema,
} from "./auth.dto.js";
import { AuthService } from "./auth.service.js";

@Controller("/auth")
export class AuthController {
    constructor(
        @Inject(AuthService) private readonly authService: AuthService
    ) { }

    /**
     * Register a new user
     * POST /auth/register
     */
    @Post("/register")
    @ZodValidate(RegisterSchema)
    async register(c: Context): Promise<Response> {
        try {
            const data = c.get("validatedData") as RegisterDto;

            const result = await this.authService.register(data);

            return ResponseUtil.success(
                c,
                result,
                "User registered successfully. Please check your email to verify your account.",
                201
            );
        } catch (error: any) {
            return ResponseUtil.error(c, error.message || "Registration failed", 400);
        }
    }

    /**
     * Login user
     * POST /auth/login
     */
    @Post("/login")
    @ZodValidate(LoginSchema)
    async login(c: Context): Promise<Response> {
        try {
            const data = c.get("validatedData") as LoginDto;

            const result = await this.authService.login(data);

            return ResponseUtil.success(c, result, "Login successful");
        } catch (error: any) {
            return ResponseUtil.error(c, error.message || "Login failed", 401);
        }
    }


    /**
     * Forgot password - Generate reset token
     * POST /auth/forgot-password
     */
    @Post("/forgot-password")
    @ZodValidate(ForgotPasswordSchema)
    async forgotPassword(c: Context): Promise<Response> {
        try {
            const data = c.get("validatedData") as ForgotPasswordDto;

            const result = await this.authService.forgotPassword(data);

            return ResponseUtil.success(
                c,
                { resetToken: result.resetToken },
                "Password reset token sent successfully"
            );
        } catch (error: any) {
            return ResponseUtil.error(
                c,
                error.message || "Failed to process request",
                400
            );
        }
    }

    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    @Post("/reset-password")
    @ZodValidate(ResetPasswordSchema)
    async resetPassword(c: Context): Promise<Response> {
        try {
            const data = c.get("validatedData") as ResetPasswordDto;

            const result = await this.authService.resetPassword(data);

            return ResponseUtil.success(c, result, "Password reset successfully");
        } catch (error: any) {
            return ResponseUtil.error(
                c,
                error.message || "Password reset failed",
                400
            );
        }
    }

    /**
     * Refresh access token
     * POST /auth/refresh
     */
    @Post("/refresh")
    @ZodValidate(RefreshTokenSchema)
    async refreshToken(c: Context): Promise<Response> {
        try {
            const data = c.get("validatedData") as RefreshTokenDto;

            const result = await this.authService.refreshToken(data);

            return ResponseUtil.success(c, result, "Token refreshed successfully");
        } catch (error: any) {
            return ResponseUtil.error(c, error.message || "Token refresh failed", 401);
        }
    }
}
