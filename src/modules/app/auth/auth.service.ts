import { Injectable, Inject } from "@wilt";
import { BcryptService } from "@src/modules/shared/helpers/brycpt.service.js";
import { JwtService } from "@src/modules/shared/helpers/jwt.service.js";
import { db, users, type User, type NewUser } from "@src/database/index.js";
import { eq } from "drizzle-orm";
import type {
    RegisterDto,
    LoginDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    RefreshTokenDto,
    ChangePasswordDto,
} from "./auth.dto.js";

interface AuthResponse {
    user: Omit<User, "password">;
    accessToken: string;
    refreshToken: string;
}

interface TokenPayload {
    id: number;
    email: string;
    role: string;
}

@Injectable()
export class AuthService {
    constructor(
        @Inject(BcryptService) private readonly bcryptService: BcryptService,
        @Inject(JwtService) private readonly jwtService: JwtService
    ) { }

    /**
     * Register a new user
     */
    async register(data: RegisterDto): Promise<Omit<User, "password">> {
        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (existingUser.length > 0) {
            throw new Error("User with this email already exists");
        }

        // Hash password
        const hashedPassword = await this.bcryptService.hash(data.password);

        // Create user
        const newUser = await db
            .insert(users)
            .values({
                email: data.email,
                name: data.name,
                password: hashedPassword,
                role: "user",
                isActive: true,
                emailVerified: false,
            })
            .returning();

        const user = newUser[0];

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return userWithoutPassword as Omit<User, "password">;
    }

    /**
     * Login user
     */
    async login(data: LoginDto): Promise<AuthResponse> {
        // Find user by email
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (result.length === 0) {
            throw new Error("Invalid email or password");
        }

        const user = result[0];

        // Check if user is active
        if (!user.isActive) {
            throw new Error("User account is deactivated");
        }

        // Verify password
        const isPasswordValid = await this.bcryptService.compare(
            data.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new Error("Invalid email or password");
        }

        // Generate tokens
        const { accessToken, refreshToken } = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Forgot password - Generate reset token
     */
    async forgotPassword(
        data: ForgotPasswordDto
    ): Promise<{ resetToken: string; message: string }> {
        // Find user by email
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, data.email))
            .limit(1);

        if (result.length === 0) {
            // Don't reveal if user exists or not for security
            throw new Error("If the email exists, a reset link will be sent");
        }

        const user = result[0];

        // Generate reset token (expires in 1 hour)
        const resetToken = await this.jwtService.sign(
            {
                id: user.id,
                email: user.email,
                type: "password-reset",
            },
            {
                expiresIn: "1h",
            }
        );

        // TODO: Send email with reset token
        // await emailService.sendPasswordResetEmail(user.email, resetToken);

        return {
            resetToken,
            message: "Password reset token generated successfully",
        };
    }

    /**
     * Reset password with token
     */
    async resetPassword(
        data: ResetPasswordDto
    ): Promise<{ message: string }> {
        // Verify token
        const decoded = await this.jwtService.verify(data.token);

        if (!decoded || decoded.type !== "password-reset") {
            throw new Error("Invalid or expired reset token");
        }

        // Check if token is expired
        const isExpired = this.jwtService.isExpired(data.token);
        if (isExpired) {
            throw new Error("Reset token has expired");
        }

        // Find user
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.id))
            .limit(1);

        if (result.length === 0) {
            throw new Error("User not found");
        }

        // Hash new password
        const hashedPassword = await this.bcryptService.hash(data.password);

        // Update password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, decoded.id));

        return {
            message: "Password reset successfully",
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(data: RefreshTokenDto): Promise<AuthResponse> {
        // Verify refresh token
        const decoded = await this.jwtService.verify(data.refreshToken);

        if (!decoded) {
            throw new Error("Invalid refresh token");
        }

        // Check if token is expired
        const isExpired = this.jwtService.isExpired(data.refreshToken);
        if (isExpired) {
            throw new Error("Refresh token has expired");
        }

        // Find user
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, decoded.id))
            .limit(1);

        if (result.length === 0) {
            throw new Error("User not found");
        }

        const user = result[0];

        // Check if user is active
        if (!user.isActive) {
            throw new Error("User account is deactivated");
        }

        // Generate new tokens
        const { accessToken, refreshToken } = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: number): Promise<Omit<User, "password">> {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (result.length === 0) {
            throw new Error("User not found");
        }

        const user = result[0];
        const { password: _, ...userWithoutPassword } = user;

        return userWithoutPassword;
    }

    /**
     * Verify email
     */
    async verifyEmail(userId: number): Promise<{ message: string }> {
        await db
            .update(users)
            .set({
                emailVerified: true,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        return {
            message: "Email verified successfully",
        };
    }

    /**
     * Generate access and refresh tokens
     */
    private async generateTokens(
        payload: TokenPayload
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const accessToken = await this.jwtService.sign(payload, {
            expiresIn: "1h",
        });

        const refreshToken = await this.jwtService.sign(payload, {
            expiresIn: "7d",
        });

        return {
            accessToken,
            refreshToken,
        };
    }
}
